import type {
  CaseEventRecord,
  CaseEventType,
  CaseRecord,
} from './case.types';
import { computeCaseStatus } from './compute-case-status';

const CASE_ID = '00000000-0000-4000-8000-000000000001';
const REQUESTED_AT = '2026-10-05';

function caseRecord(): CaseRecord {
  return {
    fullName: 'Maria Teste da Silva',
    id: CASE_ID,
    initials: 'M.F.S.',
    trigger: 'BIRADS_5',
    requestedAt: REQUESTED_AT,
    status: 'SUSPECTED',
  };
}

function created(recordedAt = REQUESTED_AT): CaseEventRecord {
  return {
    id: 'e1',
    caseId: CASE_ID,
    type: 'CASE_CREATED',
    occurredAt: REQUESTED_AT,
    recordedAt,
    payload: {
      trigger: 'BIRADS_5',
      requestedAt: REQUESTED_AT,
      source: 'UBS_BRIDGE',
    },
    correctsEventId: null,
  };
}

function event(
  id: string,
  type: CaseEventType,
  payload: Record<string, unknown> = {},
  occurredAt = REQUESTED_AT,
  recordedAt = occurredAt,
): CaseEventRecord {
  return {
    id,
    caseId: CASE_ID,
    type,
    occurredAt,
    recordedAt,
    payload,
    correctsEventId: null,
  };
}

function reportFlow(
  id: string,
  malignancy: 'malignant' | 'benign' | 'inconclusive',
  reportDate: string,
  recordedAt = reportDate,
): CaseEventRecord[] {
  return [
    event(`${id}-received`, 'REPORT_RECEIVED', {}, reportDate, recordedAt),
    event(
      id,
      'REPORT_CONFIRMED',
      {
        extractionId: '00000000-0000-4000-8000-000000000099',
        examType: 'anatomopatológico',
        reportDate,
        malignancy,
        evidenceQuote: 'trecho do laudo',
      },
      reportDate,
      recordedAt,
    ),
  ];
}

describe('computeCaseStatus', () => {
  it('computes the D30 clock, color and next step from the request date', () => {
    const result = computeCaseStatus(
      caseRecord(),
      [
        created(),
        event(
          'n1',
          'EXCEPTION_NOTED',
          { reason: 'CLINICAL_PENDING' },
          '2026-10-20',
          '2026-10-20',
        ),
      ],
      '2026-10-23',
    );

    expect(result).toMatchObject({
      status: 'SUSPECTED',
      clock: 'D30',
      day: 18,
      dayTotal: 30,
      dueDate: '2026-11-04',
      daysRemaining: 12,
      color: 'green',
      source: 'UBS_BRIDGE',
      nextStep: {
        label: 'Aguardando agendamento',
        scheduledFor: null,
        location: null,
      },
    });
  });

  it('turns yellow at 7 days remaining and red after the due date', () => {
    expect(
      computeCaseStatus(
        caseRecord(),
        [
          created(),
          event(
            'n1',
            'EXCEPTION_NOTED',
            { reason: 'CLINICAL_PENDING' },
            '2026-10-22',
            '2026-10-22',
          ),
        ],
        '2026-10-27',
      ).color,
    ).toBe('green');
    expect(
      computeCaseStatus(
        caseRecord(),
        [
          created(),
          event(
            'n1',
            'EXCEPTION_NOTED',
            { reason: 'CLINICAL_PENDING' },
            '2026-10-22',
            '2026-10-22',
          ),
        ],
        '2026-10-28',
      ).color,
    ).toBe('yellow');
    expect(
      computeCaseStatus(
        caseRecord(),
        [
          created(),
          event(
            'n1',
            'EXCEPTION_NOTED',
            { reason: 'CLINICAL_PENDING' },
            '2026-10-22',
            '2026-10-22',
          ),
        ],
        '2026-11-04',
      ).color,
    ).toBe('yellow');
    expect(
      computeCaseStatus(
        caseRecord(),
        [
          created(),
          event(
            'n1',
            'EXCEPTION_NOTED',
            { reason: 'CLINICAL_PENDING' },
            '2026-10-22',
            '2026-10-22',
          ),
        ],
        '2026-11-05',
      ).color,
    ).toBe('red');
  });

  it('closes the 30-day clock and opens 60 days from the report date', () => {
    const events = [
      created(),
      ...reportFlow('e2', 'malignant', '2026-10-30'),
    ];

    const result = computeCaseStatus(caseRecord(), events, '2026-11-30');

    expect(result).toMatchObject({
      status: 'DIAGNOSIS_CONFIRMED',
      clock: 'D60',
      day: 31,
      dayTotal: 60,
      dueDate: '2026-12-29',
      daysRemaining: 29,
      reportDate: '2026-10-30',
      outcome30: 'MET',
      outcome60: null,
    });
  });

  it('computes outcome30 met and not met', () => {
    const met = computeCaseStatus(
      caseRecord(),
      [created(), ...reportFlow('e2', 'malignant', '2026-11-04')],
      '2026-11-04',
    );
    const notMet = computeCaseStatus(
      caseRecord(),
      [created(), ...reportFlow('e2', 'malignant', '2026-11-05')],
      '2026-11-05',
    );

    expect(met.outcome30).toBe('MET');
    expect(notMet.outcome30).toBe('NOT_MET');
  });

  it('keeps the D30 clock when an inconclusive report is confirmed', () => {
    const result = computeCaseStatus(
      caseRecord(),
      [created(), ...reportFlow('e2', 'inconclusive', '2026-10-30')],
      '2026-10-30',
    );

    expect(result.status).toBe('EXAM_TO_RESCHEDULE');
    expect(result.clock).toBe('D30');
    expect(result.dueDate).toBe('2026-11-04');
    expect(result.nextStep?.label).toBe('Repetir biópsia: agendar');
  });

  it('marks silence at 7 days and does not count non-stage events', () => {
    const events = [
      created('2026-10-20'),
      event('c1', 'CONTACT_LOGGED', { channel: 'PHONE' }, '2026-10-24', '2026-10-24'),
      event('a1', 'ALERT_ACKNOWLEDGED', { alertKey: 'x' }, '2026-10-25', '2026-10-25'),
      event('x1', 'CORRECTION', { correctsEventId: 'e1', changes: {}, reason: 'x' }, '2026-10-26', '2026-10-26'),
    ];

    const six = computeCaseStatus(caseRecord(), events, '2026-10-26');
    const seven = computeCaseStatus(caseRecord(), events, '2026-10-27');

    expect(six.badges).not.toContainEqual({ type: 'SILENCE', days: 6 });
    expect(seven.badges).toContainEqual({ type: 'SILENCE', days: 7 });
    expect(seven.color).toBe('yellow');
  });

  it('suspends silence until the scheduled date and flags a missed date', () => {
    const events = [
      created('2026-10-20'),
      event('e2', 'EXAM_SCHEDULED', {
        examLabel: 'biópsia',
        scheduledFor: '2026-10-25',
        location: 'Hospital',
      }, '2026-10-20', '2026-10-20'),
    ];

    const onDate = computeCaseStatus(caseRecord(), events, '2026-10-25');
    const nextDay = computeCaseStatus(caseRecord(), events, '2026-10-26');

    expect(onDate.badges.some((badge) => badge.type === 'SILENCE')).toBe(false);
    expect(onDate.badges.some((badge) => badge.type === 'MISSED_DATE')).toBe(false);
    expect(nextDay.badges).toContainEqual({
      type: 'MISSED_DATE',
      scheduledFor: '2026-10-25',
    });
    expect(nextDay.color).toBe('yellow');
    expect(nextDay.nextStep).toMatchObject({
      label: 'biópsia agendada',
      scheduledFor: '2026-10-25',
      location: 'Hospital',
    });
  });

  it('adds the exception badge without changing the color or silence', () => {
    const events = [
      created('2026-10-20'),
      event('e2', 'EXCEPTION_NOTED', {
        reason: 'NO_CAPACITY',
        note: 'sem vaga',
      }, '2026-10-21', '2026-10-21'),
    ];

    const result = computeCaseStatus(caseRecord(), events, '2026-10-28');

    expect(result.badges).toContainEqual({
      type: 'EXCEPTION',
      reason: 'NO_CAPACITY',
      since: '2026-10-21',
    });
    expect(result.badges).toContainEqual({ type: 'SILENCE', days: 7 });
    expect(result.color).toBe('yellow');
  });

  it('flags late entry and keeps the original day zero', () => {
    const lateCreated = created('2026-11-10');
    const result = computeCaseStatus(caseRecord(), [lateCreated], '2026-11-10');

    expect(result.status).toBe('SUSPECTED');
    expect(result.clock).toBe('D30');
    expect(result.dueDate).toBe('2026-11-04');
    expect(result.color).toBe('red');
    expect(result.badges).toContainEqual({ type: 'LATE_ENTRY', daysLate: 6 });
  });

  it('computes outcome60 and closes the case when treatment starts', () => {
    const events = [
      created(),
      ...reportFlow('e2', 'malignant', '2026-10-30'),
      event('e3', 'TREATMENT_STARTED', { treatmentType: 'SURGERY' }, '2026-12-29'),
    ];

    const met = computeCaseStatus(caseRecord(), events, '2026-12-29');
    const notMet = computeCaseStatus(
      caseRecord(),
      [
        created(),
        ...reportFlow('e2', 'malignant', '2026-10-30'),
        event('e3', 'TREATMENT_STARTED', { treatmentType: 'SURGERY' }, '2026-12-30'),
      ],
      '2026-12-30',
    );

    expect(met.status).toBe('TREATMENT_STARTED');
    expect(met.clock).toBeNull();
    expect(met.color).toBeNull();
    expect(met.outcome60).toBe('MET');
    expect(notMet.outcome60).toBe('NOT_MET');
  });

  it('computes outcomes for closed exceptions', () => {
    const before = computeCaseStatus(
      caseRecord(),
      [created(), event('e2', 'CASE_CLOSED_EXCEPTION', { reason: 'DEFINITIVE_REFUSAL' }, '2026-10-20')],
      '2026-10-20',
    );
    const after = computeCaseStatus(
      caseRecord(),
      [created(), event('e2', 'CASE_CLOSED_EXCEPTION', { reason: 'DEATH' }, '2026-11-10')],
      '2026-11-10',
    );

    expect(before.outcome30).toBe('MET_UNTIL_CLOSE');
    expect(before.outcome60).toBe('NOT_APPLICABLE');
    expect(after.outcome30).toBe('NOT_MET');
    expect(after.outcome60).toBe('NOT_APPLICABLE');
  });

  it('does not expose a clock or color for a discarded case', () => {
    const result = computeCaseStatus(
      caseRecord(),
      [created(), ...reportFlow('e2', 'benign', '2026-10-20')],
      '2026-10-20',
    );

    expect(result.status).toBe('DISCARDED');
    expect(result.clock).toBeNull();
    expect(result.color).toBeNull();
    expect(result.outcome30).toBe('MET');
    expect(result.outcome60).toBe('NOT_APPLICABLE');
  });
});
