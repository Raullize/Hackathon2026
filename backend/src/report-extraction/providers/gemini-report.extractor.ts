import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  reportSuggestionCoreSchema,
  type ReportSuggestionCore,
} from '@careflow/contracts';
import type { AppEnv } from '../../config/env';
import type { ReportExtractor } from './report-extractor.interface';

const FALLBACK_PROMPT =
  'Extraia dados estruturados de um laudo. Responda somente JSON válido, sem markdown.';

function loadPrompt(): string {
  try {
    return readFileSync(join(__dirname, '..', 'prompts', 'extract-report.md'), 'utf8');
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
export class GeminiReportExtractor implements ReportExtractor {
  private readonly logger = new Logger(GeminiReportExtractor.name);
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

  async extract(filteredText: string): Promise<ReportSuggestionCore> {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    let lastError: unknown;

    for (const [index, model] of this.models.entries()) {
      try {
        return await this.extractWithModel(model, filteredText);
      } catch (error) {
        lastError = error;
        const hasNext = index < this.models.length - 1;
        if (!hasNext || !isModelUnavailable(error)) {
          throw error;
        }
        this.logger.warn(
          `Modelo ${model} indisponível para extração; tentando ${this.models[index + 1]}.`,
        );
      }
    }

    throw lastError;
  }

  private async extractWithModel(
    model: string,
    filteredText: string,
  ): Promise<ReportSuggestionCore> {
    const response = await this.client!.models.generateContent({
      model,
      contents: filteredText,
      config: {
        systemInstruction: this.prompt,
        temperature: 0,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        httpOptions: { timeout: this.timeoutMs },
      },
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error('Gemini retornou resposta vazia');
    }

    const parsed = JSON.parse(text) as unknown;
    return reportSuggestionCoreSchema.parse(parsed);
  }
}
