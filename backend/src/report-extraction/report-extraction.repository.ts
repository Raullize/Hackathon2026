import type { ReportSuggestion } from '@careflow/contracts';

export const REPORT_EXTRACTION_REPOSITORY = Symbol(
  'REPORT_EXTRACTION_REPOSITORY',
);

export interface ReportExtractionRecord {
  id: string;
  caseId: string;
  provider: 'gemini' | 'mock';
  fallbackReason: string | null;
  suggestion: ReportSuggestion;
  createdById: string;
  createdAt: Date;
  consumedAt: Date | null;
}

export interface CreateReportExtractionData {
  caseId: string;
  provider: 'gemini' | 'mock';
  fallbackReason: string | null;
  suggestion: ReportSuggestion;
  createdById: string;
}

export interface ReportExtractionRepository {
  create(data: CreateReportExtractionData): Promise<ReportExtractionRecord>;
  findById(id: string): Promise<ReportExtractionRecord | null>;
  findByCaseId(caseId: string): Promise<ReportExtractionRecord[]>;
}
