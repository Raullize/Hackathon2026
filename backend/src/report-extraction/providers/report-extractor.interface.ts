import type { ReportSuggestionCore } from '@careflow/contracts';

export interface ReportExtractor {
  extract(filteredText: string): Promise<ReportSuggestionCore>;
}
