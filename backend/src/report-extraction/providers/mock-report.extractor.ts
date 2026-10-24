import { Injectable } from '@nestjs/common';
import type { ReportSuggestionCore } from '@careflow/contracts';
import { isValidIsoDate } from '../../cases/domain/dates';
import type { ReportExtractor } from './report-extractor.interface';

const MALIGNANT_TERMS = ['carcinoma', 'invasivo', 'maligno', 'neoplasia maligna'];
const BENIGN_TERMS = ['fibroadenoma', 'benigno', 'negativo para malignidade'];

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

function findEvidence(text: string, keyword: string | null): string {
  if (keyword) {
    const sentences = text.split(/(?<=[.;])\s+|\n+/).map((sentence) => sentence.trim());
    const found = sentences.find((sentence) =>
      normalize(sentence).includes(keyword),
    );
    if (found) {
      return found.slice(0, 2000);
    }
  }

  return text.slice(0, 120);
}

@Injectable()
export class MockReportExtractor implements ReportExtractor {
  async extract(filteredText: string): Promise<ReportSuggestionCore> {
    const normalized = normalize(filteredText);
    const malignant = MALIGNANT_TERMS.filter((term) => normalized.includes(term));
    const benign = BENIGN_TERMS.filter((term) => normalized.includes(term));

    let malignancy: 'malignant' | 'benign' | 'inconclusive' = 'inconclusive';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let keyword: string | null = null;

    if (malignant.length > 0 && benign.length === 0) {
      malignancy = 'malignant';
      confidence = 'medium';
      keyword = malignant[0] ?? null;
    } else if (benign.length > 0 && malignant.length === 0) {
      malignancy = 'benign';
      confidence = 'medium';
      keyword = benign[0] ?? null;
    } else if (malignant.length > 0 && benign.length > 0) {
      malignancy = 'inconclusive';
      confidence = 'low';
    }

    return {
      examType: normalized.includes('anatomopatol')
        ? 'anatomopatológico'
        : 'não identificado',
      reportDate: findDate(filteredText),
      malignancy,
      confidence,
      evidenceQuote: findEvidence(filteredText, keyword),
    };
  }
}
