import type { CaseEventRecord, CaseEventType } from './case.types';
import {
  InvalidCorrectionError,
  applyCorrections,
} from './corrections';

const CASE_ID = '00000000-0000-4000-8000-000000000001';

function event(
  id: string,
  type: CaseEventType,
  payload: Record<string, unknown> = {},
  overrides: Partial<CaseEventRecord> = {},
): CaseEventRecord {
  return {
    id,
    caseId: CASE_ID,
    type,
    occurredAt: '2026-10-01',
    recordedAt: '2026-10-01',
    payload,
    correctsEventId: null,
    ...overrides,
  };
}

function correction(
  id: string,
  correctsEventId: string,
  changes: Record<string, unknown>,
  recordedAt = '2026-10-05',
): CaseEventRecord {
  return event(
    id,
    'CORRECTION',
    {
      correctsEventId,
      changes,
      reason: 'erro de digitação',
    },
    { recordedAt, correctsEventId },
  );
}

describe('corrections', () => {
  it('applies a correction to requestedAt and trigger without mutating input', () => {
    const created = event('e1', 'CASE_CREATED', {
      requestedAt: '2026-10-01',
      trigger: 'BIRADS_4',
      source: 'UBS_BRIDGE',
    });
    const events = [
      created,
      correction('c1', 'e1', {
        requestedAt: '2026-09-20',
        trigger: 'BIRADS_5',
      }),
    ];

    const effective = applyCorrections(events);
    const effectiveCreated = effective.find((item) => item.id === 'e1')!;

    expect(effectiveCreated.payload).toMatchObject({
      requestedAt: '2026-09-20',
      trigger: 'BIRADS_5',
    });
    expect(created.payload).toMatchObject({
      requestedAt: '2026-10-01',
      trigger: 'BIRADS_4',
    });
  });

  it('uses the latest correction for the same event', () => {
    const created = event('e1', 'CASE_CREATED', {
      requestedAt: '2026-10-01',
      trigger: 'BIRADS_4',
      source: 'UBS_BRIDGE',
    });
    const events = [
      created,
      correction('c1', 'e1', { requestedAt: '2026-09-25' }, '2026-10-05'),
      correction('c2', 'e1', { requestedAt: '2026-09-20' }, '2026-10-06'),
    ];

    const effective = applyCorrections(events);
    expect(effective.find((item) => item.id === 'e1')!.payload).toMatchObject({
      requestedAt: '2026-09-20',
    });
  });

  it('corrects exam scheduled fields', () => {
    const scheduled = event(
      'e2',
      'EXAM_SCHEDULED',
      {
        examLabel: 'biópsia',
        scheduledFor: '2026-10-15',
        location: 'Hospital A',
      },
      { occurredAt: '2026-10-03' },
    );
    const events = [
      event('e1', 'CASE_CREATED', {}),
      scheduled,
      correction('c1', 'e2', {
        scheduledFor: '2026-10-18',
        location: 'Hospital B',
      }),
    ];

    const effective = applyCorrections(events);
    const corrected = effective.find((item) => item.id === 'e2')!;
    expect(corrected.occurredAt).toBe('2026-10-03');
    expect(corrected.payload).toMatchObject({
      scheduledFor: '2026-10-18',
      location: 'Hospital B',
    });
  });

  it('allows report date correction but never malignancy', () => {
    const confirmed = event('e3', 'REPORT_CONFIRMED', {
      reportDate: '2026-10-20',
      malignancy: 'malignant',
      examType: 'anatomopatológico',
      evidenceQuote: 'carcinoma',
    });
    const base = [event('e1', 'CASE_CREATED', {}), confirmed];

    const corrected = applyCorrections([
      ...base,
      correction('c1', 'e3', { reportDate: '2026-10-19' }),
    ]);
    expect(corrected.find((item) => item.id === 'e3')!.payload).toMatchObject({
      reportDate: '2026-10-19',
    });

    expect(() =>
      applyCorrections([
        ...base,
        correction('c2', 'e3', { malignancy: 'benign' }),
      ]),
    ).toThrow(InvalidCorrectionError);
  });

  it('rejects correction of unknown event, transition type or correction itself', () => {
    const base = [event('e1', 'CASE_CREATED', {})];

    expect(() =>
      applyCorrections([...base, correction('c1', 'missing', { requestedAt: '2026-10-01' })]),
    ).toThrow(InvalidCorrectionError);

    expect(() =>
      applyCorrections([...base, correction('c1', 'e1', { type: 'SUSPECTED' })]),
    ).toThrow(InvalidCorrectionError);

    expect(() =>
      applyCorrections([
        ...base,
        correction('c1', 'c1', { requestedAt: '2026-10-01' }),
      ]),
    ).toThrow(InvalidCorrectionError);
  });

  it('corrects treatment and exception fields', () => {
    const treatment = event(
      'e4',
      'TREATMENT_STARTED',
      { treatmentType: 'SURGERY' },
      { occurredAt: '2026-12-01' },
    );
    const exception = event(
      'e5',
      'EXCEPTION_NOTED',
      { reason: 'TRANSPORT', note: 'sem transporte' },
      { occurredAt: '2026-11-01' },
    );

    const effective = applyCorrections([
      event('e1', 'CASE_CREATED', {}),
      treatment,
      exception,
      correction('c1', 'e4', {
        occurredAt: '2026-12-02',
        treatmentType: 'CHEMOTHERAPY',
      }),
      correction('c2', 'e5', {
        occurredAt: '2026-11-02',
        reason: 'NO_CAPACITY',
        note: 'sem vaga',
      }),
    ]);

    expect(effective.find((item) => item.id === 'e4')).toMatchObject({
      occurredAt: '2026-12-02',
      payload: { treatmentType: 'CHEMOTHERAPY' },
    });
    expect(effective.find((item) => item.id === 'e5')).toMatchObject({
      occurredAt: '2026-11-02',
      payload: { reason: 'NO_CAPACITY', note: 'sem vaga' },
    });
  });
});
