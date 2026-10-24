import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CaseIntakeSuggestion, CaseIntakeView } from '@careflow/contracts';
import type { AppEnv } from '../config/env';
import { IntakeSanitizer } from './intake-sanitizer';
import { GeminiCaseIntakeExtractor } from './providers/gemini-case-intake.extractor';
import { MockCaseIntakeExtractor } from './providers/mock-case-intake.extractor';

function fallbackReasonFor(error: unknown): string {
  if (error instanceof Error && /timeout|deadline|timed out/i.test(error.message)) {
    return 'timeout';
  }
  return 'provider_error';
}

@Injectable()
export class CaseIntakeService {
  constructor(
    private readonly config: ConfigService<AppEnv, true>,
    private readonly sanitizer: IntakeSanitizer,
    private readonly mock: MockCaseIntakeExtractor,
    private readonly gemini: GeminiCaseIntakeExtractor,
  ) {}

  async extract(requestText: string): Promise<CaseIntakeView> {
    const sanitizedText = this.sanitizer.sanitize(requestText);
    const providerChoice = this.config.get('LLM_PROVIDER', { infer: true });
    const hasApiKey = Boolean(
      this.config.get('GEMINI_API_KEY', { infer: true }),
    );

    let provider: 'gemini' | 'mock' = 'mock';
    let fallbackReason: string | null = null;
    let suggestion: CaseIntakeSuggestion;

    if (providerChoice === 'gemini' && hasApiKey) {
      try {
        suggestion = await this.gemini.extract(sanitizedText);
        provider = 'gemini';
      } catch (error) {
        fallbackReason = fallbackReasonFor(error);
        suggestion = await this.mock.extract(sanitizedText);
      }
    } else {
      if (providerChoice === 'gemini') {
        fallbackReason = 'no_api_key';
      }
      suggestion = await this.mock.extract(sanitizedText);
    }

    if (!sanitizedText.includes(suggestion.evidenceQuote)) {
      fallbackReason = 'invalid_output';
      provider = 'mock';
      suggestion = await this.mock.extract(sanitizedText);
    }

    return {
      provider,
      fallbackReason,
      suggestion,
    };
  }
}
