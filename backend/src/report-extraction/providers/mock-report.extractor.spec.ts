import { MockReportExtractor } from './mock-report.extractor';

describe('MockReportExtractor', () => {
  const extractor = new MockReportExtractor();

  it('extracts a malignant report', async () => {
    const result = await extractor.extract(
      'Anatomopatológico. Carcinoma ductal invasivo. Data: 03/10/2026.',
    );

    expect(result).toMatchObject({
      examType: 'anatomopatológico',
      reportDate: '2026-10-03',
      malignancy: 'malignant',
      confidence: 'medium',
    });
    expect(result.evidenceQuote).toContain('Carcinoma');
  });

  it('extracts a benign report', async () => {
    const result = await extractor.extract(
      'Fibroadenoma, negativo para malignidade. Data: 03/10/2026.',
    );

    expect(result.malignancy).toBe('benign');
    expect(result.confidence).toBe('medium');
  });

  it('returns inconclusive for missing or conflicting evidence', async () => {
    await expect(extractor.extract('Material insuficiente.')).resolves.toMatchObject({
      malignancy: 'inconclusive',
      confidence: 'low',
    });

    await expect(
      extractor.extract('Carcinoma invasivo; linfonodo negativo para malignidade.'),
    ).resolves.toMatchObject({
      malignancy: 'inconclusive',
      confidence: 'low',
    });
  });
});
