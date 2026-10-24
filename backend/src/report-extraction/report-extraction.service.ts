import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ReportExtractionView,
  ReportSuggestionCore,
} from '@careflow/contracts';
import { PrismaService } from '../prisma/prisma.service';
import type { AppEnv } from '../config/env';
import { IdentifierFilter } from './identifier-filter';
import { MockReportExtractor } from './providers/mock-report.extractor';
import { GeminiReportExtractor } from './providers/gemini-report.extractor';
import {
  REPORT_EXTRACTION_REPOSITORY,
  type ReportExtractionRepository,
} from './report-extraction.repository';

function fallbackReasonFor(error: unknown): string {
  if (error instanceof Error && /timeout|deadline|timed out/i.test(error.message)) {
    return 'timeout';
  }
  return 'provider_error';
}

@Injectable()
export class ReportExtractionService {
  constructor(
    @Inject(REPORT_EXTRACTION_REPOSITORY)
    private readonly repository: ReportExtractionRepository,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly filter: IdentifierFilter,
    private readonly mock: MockReportExtractor,
    private readonly gemini: GeminiReportExtractor,
  ) {}

  async extract(
    caseId: string,
    reportText: string,
    userId: string,
  ): Promise<ReportExtractionView> {
    const patient = await this.prisma.case.findUnique({
      where: { id: caseId },
      select: { fullName: true, cns: true, status: true },
    });

    if (!patient) {
      throw new NotFoundException('Caso não encontrado');
    }

    if (
      ['TREATMENT_STARTED', 'DISCARDED', 'CLOSED_EXCEPTION'].includes(
        patient.status,
      )
    ) {
      throw new ConflictException('Caso fechado não aceita extração');
    }

    const filteredText = this.filter.filter(reportText, patient);
    const providerChoice = this.config.get('LLM_PROVIDER', { infer: true });
    const hasApiKey = Boolean(
      this.config.get('GEMINI_API_KEY', { infer: true }),
    );

    let provider: 'gemini' | 'mock' = 'mock';
    let fallbackReason: string | null = null;
    let suggestion: ReportSuggestionCore;

    if (providerChoice === 'gemini' && hasApiKey) {
      try {
        suggestion = await this.gemini.extract(filteredText);
        provider = 'gemini';
      } catch (error) {
        fallbackReason = fallbackReasonFor(error);
        suggestion = await this.mock.extract(filteredText);
      }
    } else {
      if (providerChoice === 'gemini') {
        fallbackReason = 'no_api_key';
      }
      suggestion = await this.mock.extract(filteredText);
    }

    if (!filteredText.includes(suggestion.evidenceQuote)) {
      fallbackReason = 'invalid_output';
      provider = 'mock';
      suggestion = await this.mock.extract(filteredText);
    }

    const fullSuggestion = { ...suggestion, provider };
    const extraction = await this.repository.create({
      caseId,
      provider,
      fallbackReason,
      suggestion: fullSuggestion,
      demoRawText: this.config.get('DEMO_MODE', { infer: true })
        ? reportText
        : null,
      createdById: userId,
    });

    return {
      extractionId: extraction.id,
      provider,
      fallbackReason,
      suggestion: fullSuggestion,
    };
  }
}
