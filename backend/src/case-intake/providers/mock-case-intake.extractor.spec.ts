import { MockCaseIntakeExtractor } from './mock-case-intake.extractor';

describe('MockCaseIntakeExtractor', () => {
  const extractor = new MockCaseIntakeExtractor();

  it('extracts trigger, date and exam from a request', async () => {
    await expect(
      extractor.extract(
        'Solicitação de biópsia de mama por BI-RADS 5. Data do pedido: 01/10/2026.',
      ),
    ).resolves.toMatchObject({
      requestedAt: '2026-10-01',
      trigger: 'BIRADS_5',
      examLabel: 'biópsia',
    });
  });

  it('falls back to clinical suspicion and null date', async () => {
    await expect(
      extractor.extract('Solicitação de mamografia por nódulo palpável.'),
    ).resolves.toMatchObject({
      requestedAt: null,
      trigger: 'CLINICAL_SUSPICION',
      examLabel: 'mamografia',
    });
  });
});
