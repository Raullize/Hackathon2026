import { Injectable } from '@nestjs/common';
import type { CaseIntakeSuggestion } from '@careflow/contracts';
import { isValidIsoDate } from '../../cases/domain/dates';
import type { CaseIntakeExtractor } from './case-intake-extractor.interface';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function findDate(text: string): string | null {
  const match = /\b(\d{2})\/(\d{2})\/(\d{4})\b/.exec(text);
  if (!match) {
    return null;
  }
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return isValidIsoDate(iso) ? iso : null;
}

function findTrigger(text: string): CaseIntakeSuggestion['trigger'] {
  const normalized = normalize(text);
  if (/bi[-\s]?rads\s*5/.test(normalized)) {
    return 'BIRADS_5';
  }
  if (/bi[-\s]?rads\s*4/.test(normalized)) {
    return 'BIRADS_4';
  }
  return 'CLINICAL_SUSPICION';
}

function findExam(text: string): string {
  const normalized = normalize(text);
  if (normalized.includes('biopsia')) {
    return 'biópsia';
  }
  if (normalized.includes('mamografia')) {
    return 'mamografia';
  }
  if (normalized.includes('consulta')) {
    return 'consulta';
  }
  return 'não identificado';
}

function findEvidence(text: string): string {
  const sentences = text.split(/(?<=[.;])\s+|\n+/).map((sentence) => sentence.trim());
  const trigger = sentences.find((sentence) =>
    /bi[-\s]?rads|suspeita|nodulo|nódulo|biopsia|biópsia/i.test(sentence),
  );
  return (trigger ?? text).slice(0, 2000);
}

@Injectable()
export class MockCaseIntakeExtractor implements CaseIntakeExtractor {
  async extract(sanitizedText: string): Promise<CaseIntakeSuggestion> {
    return {
      requestedAt: findDate(sanitizedText),
      trigger: findTrigger(sanitizedText),
      examLabel: findExam(sanitizedText),
      evidenceQuote: findEvidence(sanitizedText),
    };
  }
}
