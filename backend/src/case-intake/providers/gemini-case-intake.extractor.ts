import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  caseIntakeSuggestionSchema,
  type CaseIntakeSuggestion,
} from '@careflow/contracts';
import type { AppEnv } from '../../config/env';
import type { CaseIntakeExtractor } from './case-intake-extractor.interface';

const FALLBACK_PROMPT =
  'Extraia dados de um pedido de exame. Responda somente JSON válido, sem dados pessoais.';

function loadPrompt(): string {
  try {
    return readFileSync(join(__dirname, '..', 'prompts', 'extract-intake.md'), 'utf8');
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
  return error instanceof Error && /403|404|not found|permission/i.test(error.message);
}

@Injectable()
export class GeminiCaseIntakeExtractor implements CaseIntakeExtractor {
  private readonly logger = new Logger(GeminiCaseIntakeExtractor.name);
  private readonly client: GoogleGenAI | null;
  private readonly models: string[];
  private readonly timeoutMs: number;
  private readonly prompt = loadPrompt();

  constructor(private readonly config: ConfigService<AppEnv, true>) {
    const apiKey = this.config.get('GEMINI_API_KEY', { infer: true });
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.models = [
      ...new Set([
        this.config.get('GEMINI_MODEL', { infer: true }),
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash-lite',
      ]),
    ];
    this.timeoutMs = this.config.get('REPORT_EXTRACTION_TIMEOUT_MS', {
      infer: true,
    });
  }

  async extract(sanitizedText: string): Promise<CaseIntakeSuggestion> {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    let lastError: unknown;

    for (const [index, model] of this.models.entries()) {
      try {
        return await this.extractWithModel(model, sanitizedText);
      } catch (error) {
        lastError = error;
        const hasNext = index < this.models.length - 1;
        if (!hasNext || !isModelUnavailable(error)) {
          throw error;
        }
        this.logger.warn(
          `Modelo ${model} indisponível para intake; tentando ${this.models[index + 1]}.`,
        );
      }
    }

    throw lastError;
  }

  private async extractWithModel(
    model: string,
    sanitizedText: string,
  ): Promise<CaseIntakeSuggestion> {
    const response = await this.client!.models.generateContent({
      model,
      contents: sanitizedText,
      config: {
        systemInstruction: this.prompt,
        temperature: 0,
        maxOutputTokens: 512,
        responseMimeType: 'application/json',
        httpOptions: { timeout: this.timeoutMs },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Gemini retornou resposta vazia');
    }

    return caseIntakeSuggestionSchema.parse(JSON.parse(text) as unknown);
  }
}
