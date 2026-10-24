import { ConfigService } from '@nestjs/config';
import type { ReportSuggestionCore } from '@careflow/contracts';
import type { AppEnv } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { IdentifierFilter } from './identifier-filter';
import { GeminiReportExtractor } from './providers/gemini-report.extractor';
import { MockReportExtractor } from './providers/mock-report.extractor';
import type { ReportExtractionRepository } from './report-extraction.repository';
import { ReportExtractionService } from './report-extraction.service';

const core: ReportSuggestionCore = {
  examType: 'anatomopatológico',
  reportDate: '2026-10-03',
  malignancy: 'malignant',
  confidence: 'medium',
  evidenceQuote: 'carcinoma ductal',
};

function createService(options: {
  provider: 'gemini' | 'mock';
  hasKey: boolean;
  geminiResult?: ReportSuggestionCore;
  geminiError?: Error;
  mockResult?: ReportSuggestionCore;
  filteredText?: string;
}) {
  const repository = {
    create: jest.fn().mockResolvedValue({ id: 'extraction-1' }),
  } as unknown as ReportExtractionRepository;
  const prisma = {
    case: {
      findUnique: jest.fn().mockResolvedValue({
        fullName: 'Maria Teste',
        cns: '123456789012345',
      }),
    },
  } as unknown as PrismaService;
  const values: Partial<AppEnv> = {
    LLM_PROVIDER: options.provider,
    GEMINI_API_KEY: options.hasKey ? 'key' : undefined,
    DEMO_MODE: false,
  };
  const config = {
    get: jest.fn((key: keyof AppEnv) => values[key]),
  } as unknown as ConfigService<AppEnv, true>;
  const filter = {
    filter: jest.fn().mockReturnValue(options.filteredText ?? 'carcinoma ductal'),
  } as unknown as IdentifierFilter;
  const mock = {
    extract: jest
      .fn()
      .mockResolvedValue(options.mockResult ?? core),
  } as unknown as MockReportExtractor;
  const gemini = {
    extract: options.geminiError
      ? jest.fn().mockRejectedValue(options.geminiError)
      : jest.fn().mockResolvedValue(options.geminiResult ?? core),
  } as unknown as GeminiReportExtractor;

  return {
    service: new ReportExtractionService(
      repository,
      prisma,
      config,
      filter,
      mock,
      gemini,
    ),
    repository,
    gemini,
    mock,
  };
}

describe('ReportExtractionService', () => {
  it('uses Gemini when configured and successful', async () => {
    const { service, repository } = createService({
      provider: 'gemini',
      hasKey: true,
    });

    await expect(service.extract('case-1', 'laudo', 'user-1')).resolves.toMatchObject({
      extractionId: 'extraction-1',
      provider: 'gemini',
      fallbackReason: null,
      suggestion: { provider: 'gemini' },
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        suggestion: expect.objectContaining({ provider: 'gemini' }),
      }),
    );
  });

  it('falls back to mock when Gemini times out', async () => {
    const { service, mock } = createService({
      provider: 'gemini',
      hasKey: true,
      geminiError: new Error('timeout'),
    });

    await expect(service.extract('case-1', 'laudo', 'user-1')).resolves.toMatchObject({
      provider: 'mock',
      fallbackReason: 'timeout',
      suggestion: { provider: 'mock' },
    });
    expect(mock.extract).toHaveBeenCalled();
  });

  it('falls back when the evidence quote is not literal', async () => {
    const { service } = createService({
      provider: 'gemini',
      hasKey: true,
      geminiResult: { ...core, evidenceQuote: 'trecho inventado' },
      filteredText: 'carcinoma ductal',
    });

    await expect(service.extract('case-1', 'laudo', 'user-1')).resolves.toMatchObject({
      provider: 'mock',
      fallbackReason: 'invalid_output',
    });
  });

  it('uses mock with no_api_key when Gemini is selected without a key', async () => {
    const { service, mock } = createService({
      provider: 'gemini',
      hasKey: false,
    });

    await expect(service.extract('case-1', 'laudo', 'user-1')).resolves.toMatchObject({
      provider: 'mock',
      fallbackReason: 'no_api_key',
    });
    expect(mock.extract).toHaveBeenCalled();
  });
});
