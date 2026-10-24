import type { CaseEventRecord, CaseRecord } from './case.types';
import { buildAlerts } from './alerts';

const caseRecord: CaseRecord = {
  fullName: 'Maria Fictícia da Silva',
  id: '00000000-0000-4000-8000-000000000001',
  initials: 'M.F.S.',
  trigger: 'BIRADS_5',
  requestedAt: '2026-10-01',
  status: 'SUSPECTED',
};

const events: CaseEventRecord[] = [
  {
    id: 'e1',
    caseId: caseRecord.id,
    type: 'CASE_CREATED',
    occurredAt: '2026-10-01',
    recordedAt: '2026-11-10',
    payload: {
      trigger: 'BIRADS_5',
      requestedAt: '2026-10-01',
      source: 'UBS_BRIDGE',
    },
  },
];

describe('buildAlerts', () => {
  it('builds late entry, overdue and silence keys with clock', () => {
    const alerts = buildAlerts(caseRecord, events, '2026-11-10');

    expect(alerts).toContainEqual(
      expect.objectContaining({
        reason: 'LATE_ENTRY',
        recipient: 'COORDINATION',
        key: `${caseRecord.id}:LATE_ENTRY:D30:2026-10-31`,
      }),
    );
    expect(alerts).toContainEqual(
      expect.objectContaining({
        reason: 'OVERDUE',
        recipient: 'COORDINATION',
        key: `${caseRecord.id}:OVERDUE:D30:2026-10-31`,
      }),
    );
  });

  it('builds a silence alert with a stable reference date', () => {
    const alerts = buildAlerts(
      caseRecord,
      [
        {
          ...events[0]!,
          recordedAt: '2026-10-01',
        },
      ],
      '2026-10-30',
    );

    expect(alerts).toContainEqual(
      expect.objectContaining({
        reason: 'SILENCE',
        recipient: 'NAVIGATOR',
        key: `${caseRecord.id}:SILENCE:D30:2026-10-08`,
      }),
    );
  });
});
