import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChatMessage, ChatResponse } from '@hackathon/contracts';
import type { AppEnv } from '../config/env';
import { GeminiProvider } from './providers/gemini.provider';
import { MockProvider } from './providers/mock.provider';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly config: ConfigService<AppEnv, true>,
    private readonly gemini: GeminiProvider,
    private readonly mock: MockProvider,
  ) {}

  async generate(messages: ChatMessage[]): Promise<ChatResponse> {
    const provider = this.config.get('LLM_PROVIDER', { infer: true });
    const hasApiKey = Boolean(
      this.config.get('GEMINI_API_KEY', { infer: true }),
    );

    if (provider === 'gemini' && hasApiKey) {
      try {
        return await this.gemini.generate(messages);
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : 'erro desconhecido';
        this.logger.warn(
          `Gemini indisponível; respondendo com mock. Motivo: ${reason}`,
        );
      }
    }

    return this.mock.generate(messages);
  }
}
