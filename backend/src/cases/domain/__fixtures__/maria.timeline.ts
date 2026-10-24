import type { CaseEventRecord, CaseRecord } from '../case.types';

export const MARIA_CASE: CaseRecord = {
  fullName: 'Maria Fictícia da Silva',
  id: '00000000-0000-4000-8000-000000000010',
  initials: 'M.F.S.',
  trigger: 'BIRADS_5',
  requestedAt: '2026-10-05',
  status: 'SUSPECTED',
};

export const MARIA_TIMELINE: CaseEventRecord[] = [
  {
    id: '00000000-0000-4000-8000-000000000011',
    caseId: MARIA_CASE.id,
    type: 'CASE_CREATED',
    occurredAt: '2026-10-05',
    recordedAt: '2026-10-05',
    payload: {
      trigger: 'BIRADS_5',
      requestedAt: '2026-10-05',
      source: 'UBS_BRIDGE',
    },
    correctsEventId: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    caseId: MARIA_CASE.id,
    type: 'EXAM_SCHEDULED',
    occurredAt: '2026-10-20',
    recordedAt: '2026-10-20',
    payload: {
      examLabel: 'biópsia',
      scheduledFor: '2026-10-25',
      location: 'Hospital Ana Nery',
    },
    correctsEventId: null,
  },
];

export const MARIA_REPORT_EVENTS: CaseEventRecord[] = [
  ...MARIA_TIMELINE,
  {
    id: '00000000-0000-4000-8000-000000000013',
    caseId: MARIA_CASE.id,
    type: 'REPORT_RECEIVED',
    occurredAt: '2026-10-30',
    recordedAt: '2026-10-30',
    payload: {},
    correctsEventId: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000014',
    caseId: MARIA_CASE.id,
    type: 'REPORT_CONFIRMED',
    occurredAt: '2026-10-30',
    recordedAt: '2026-10-30',
    payload: {
      extractionId: '00000000-0000-4000-8000-000000000099',
      examType: 'anatomopatológico',
      reportDate: '2026-10-30',
      malignancy: 'malignant',
      evidenceQuote: 'carcinoma ductal invasivo',
    },
    correctsEventId: null,
  },
];
