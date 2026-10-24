import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import type { ChatMessage, ChatResponse } from '@careflow/contracts';
import type { AppEnv } from '../../config/env';
import type { ChatProvider } from './chat-provider.interface';

const FALLBACK_PROMPT =
  'Você é um assistente útil para uma equipe de hackathon. Responda em português do Brasil e não invente informações.';

function loadSystemPrompt(): string {
  try {
    return readFileSync(join(__dirname, '..', 'prompts', 'system.md'), 'utf8');
  } catch {
    return FALLBACK_PROMPT;
  }
}

function isModelUnavailable(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const status = (error as { status?: unknown }).status;
    const code = (error as { code?: unknown }).code;
    if (status === 403 || status === 404 || code === 403 || code === 404) {
      return true;
    }
  }

  return (
    error instanceof Error &&
    /403|404|not found|no longer available|permission/i.test(error.message)
  );
}

@Injectable()
export class GeminiProvider implements ChatProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenAI | null;
  private readonly configuredModel: string;
  private readonly fallbackModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
  ];
  private readonly systemPrompt = loadSystemPrompt();
  private readonly maxOutputTokens: number;
  private readonly temperature: number;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService<AppEnv, true>) {
    const apiKey = this.config.get('GEMINI_API_KEY', { infer: true });
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.configuredModel = this.config.get('GEMINI_MODEL', { infer: true });
    this.maxOutputTokens = this.config.get('GEMINI_MAX_OUTPUT_TOKENS', {
      infer: true,
    });
    this.temperature = this.config.get('GEMINI_TEMPERATURE', { infer: true });
    this.timeoutMs = this.config.get('LLM_TIMEOUT_MS', { infer: true });
  }

  async generate(messages: ChatMessage[]): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const models = [
      ...new Set([this.configuredModel, ...this.fallbackModels]),
    ];
    let lastError: unknown;

    for (const [index, model] of models.entries()) {
      try {
        return await this.generateWithModel(model, messages);
      } catch (error) {
        lastError = error;
        const hasNextModel = index < models.length - 1;

        if (!hasNextModel || !isModelUnavailable(error)) {
          throw error;
        }

        this.logger.warn(
          `Modelo ${model} indisponível para esta chave; tentando ${models[index + 1]}.`,
        );
      }
    }

    throw lastError;
  }

  private async generateWithModel(
    model: string,
    messages: ChatMessage[],
  ): Promise<ChatResponse> {
    const contents = messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

    const response = await this.client!.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: this.systemPrompt,
        temperature: this.temperature,
        maxOutputTokens: this.maxOutputTokens,
        httpOptions: { timeout: this.timeoutMs },
      },
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error('Gemini retornou uma resposta vazia');
    }

    return {
      message: text,
      model,
      provider: 'gemini',
    };
  }
}
