import { ConfigService } from '@nestjs/config';
import type { ChatMessage } from '@careflow/contracts';
import type { AppEnv } from '../config/env';
import { ChatService } from './chat.service';
import { GeminiProvider } from './providers/gemini.provider';
import { MockProvider } from './providers/mock.provider';

const messages: ChatMessage[] = [
  { role: 'user', content: 'Qual é o próximo passo do projeto?' },
];

const mockResponse = {
  message: '[mock] resposta',
  model: 'mock',
  provider: 'mock' as const,
};

const geminiResponse = {
  message: 'resposta do gemini',
  model: 'gemini-3.5-flash-lite',
  provider: 'gemini' as const,
};

function createConfig(values: Partial<AppEnv>): ConfigService<AppEnv, true> {
  return {
    get: jest.fn((key: keyof AppEnv) => values[key]),
  } as unknown as ConfigService<AppEnv, true>;
}

function createService(
  values: Partial<AppEnv>,
  geminiGenerate = jest.fn().mockResolvedValue(geminiResponse),
): {
  service: ChatService;
  gemini: jest.Mocked<Pick<GeminiProvider, 'generate'>>;
  mock: jest.Mocked<Pick<MockProvider, 'generate'>>;
} {
  const gemini = { generate: geminiGenerate };
  const mock = { generate: jest.fn().mockResolvedValue(mockResponse) };
  const service = new ChatService(
    createConfig(values),
    gemini as unknown as GeminiProvider,
    mock as unknown as MockProvider,
  );

  return { service, gemini, mock };
}

describe('ChatService', () => {
  it('uses the mock provider when LLM_PROVIDER=mock', async () => {
    const { service, gemini, mock } = createService({
      LLM_PROVIDER: 'mock',
      GEMINI_API_KEY: 'key',
    });

    await expect(service.generate(messages)).resolves.toEqual(mockResponse);
    expect(gemini.generate).not.toHaveBeenCalled();
    expect(mock.generate).toHaveBeenCalledWith(messages);
  });

  it('falls back to mock when Gemini fails', async () => {
    const { service, gemini, mock } = createService(
      {
        LLM_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'key',
      },
      jest.fn().mockRejectedValue(new Error('quota exceeded')),
    );

    await expect(service.generate(messages)).resolves.toEqual(mockResponse);
    expect(gemini.generate).toHaveBeenCalledWith(messages);
    expect(mock.generate).toHaveBeenCalledWith(messages);
  });

  it('uses Gemini when configured and the call succeeds', async () => {
    const { service, gemini, mock } = createService({
      LLM_PROVIDER: 'gemini',
      GEMINI_API_KEY: 'key',
    });

    await expect(service.generate(messages)).resolves.toEqual(geminiResponse);
    expect(gemini.generate).toHaveBeenCalledWith(messages);
    expect(mock.generate).not.toHaveBeenCalled();
  });
});
