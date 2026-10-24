import type { CaseIntakeSuggestion } from '@careflow/contracts';

export interface CaseIntakeExtractor {
  extract(sanitizedText: string): Promise<CaseIntakeSuggestion>;
}
