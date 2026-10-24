import type {
  CaseBadge,
  CaseEventRecord,
  CaseEventType,
  CaseRecord,
  CaseSource,
  CaseStatus,
  CaseTrigger,
  ComputedCase,
  ExceptionReason,
  IsoDate,
  Outcome30,
  Outcome60,
} from './case.types';
import { applyCorrections } from './corrections';
import { addDays, diffDays, isValidIsoDate } from './dates';
import { DEADLINE_RULES } from './deadline-rules';
import { applyEvent, getAllowedEventTypes, isClosedStatus } from './transitions';

const D30_STATUSES: CaseStatus[] = [
  'SUSPECTED',
  'EXAM_SCHEDULED',
  'EXAM_DONE',
  'EXAM_TO_RESCHEDULE',
  'REPORT_PENDING_CONFIRMATION',
];

const NEWS_EVENTS: CaseEventType[] = [
  'CASE_CREATED',
  'EXAM_SCHEDULED',
  'EXAM_DONE',
  'REPORT_RECEIVED',
  'REPORT_CONFIRMED',
  'TREATMENT_STARTED',
  'EXCEPTION_NOTED',
];

const TRIGGERS = new Set<CaseTrigger>([
  'BIRADS_4',
  'BIRADS_5',
  'CLINICAL_SUSPICION',
]);

const SOURCES = new Set<CaseSource>([
  'UBS_BRIDGE',
  'REGULATION',
  'SISCAN',
  'PROVIDER',
  'OTHER',
]);

const EXCEPTION_REASONS = new Set<ExceptionReason>([
  'REFUSAL',
  'ABSENCE',
  'CONTRAINDICATION',
  'CLINICAL_PENDING',
  'TRANSPORT',
  'NO_CAPACITY',
]);

export class MissingCaseCreatedEventError extends Error {
  constructor() {
    super('Case timeline has no CASE_CREATED event');
    this.name = 'MissingCaseCreatedEventError';
  }
}

function asIsoDate(value: unknown, field: string): IsoDate {
  if (typeof value !== 'string' || !isValidIsoDate(value)) {
    throw new Error(`${field} must be a valid YYYY-MM-DD date`);
  }
  return value;
}

function asTrigger(value: unknown, fallback: CaseTrigger): CaseTrigger {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'string' || !TRIGGERS.has(value as CaseTrigger)) {
    throw new Error('Invalid case trigger');
  }
  return value as CaseTrigger;
}

function asSource(value: unknown): CaseSource {
  if (typeof value !== 'string' || !SOURCES.has(value as CaseSource)) {
    throw new Error('Invalid case source');
  }
  return value as CaseSource;
}

function asExceptionReason(value: unknown): ExceptionReason {
  if (
    typeof value !== 'string' ||
    !EXCEPTION_REASONS.has(value as ExceptionReason)
  ) {
    throw new Error('Invalid exception reason');
  }
  return value as ExceptionReason;
}

function outcomeForDate(
  completedAt: IsoDate,
  dueDate: IsoDate,
): 'MET' | 'NOT_MET' {
  return diffDays(completedAt, dueDate) <= 0 ? 'MET' : 'NOT_MET';
}

function outcomeUntilClose(
  completedAt: IsoDate,
  dueDate: IsoDate,
): 'MET_UNTIL_CLOSE' | 'NOT_MET' {
  return diffDays(completedAt, dueDate) <= 0 ? 'MET_UNTIL_CLOSE' : 'NOT_MET';
}

export function computeCaseStatus(
  caseRecord: CaseRecord,
  events: CaseEventRecord[],
  today: IsoDate,
): ComputedCase {
  if (!isValidIsoDate(today)) {
    throw new Error('today must be a valid YYYY-MM-DD date');
  }

  const effective = applyCorrections(events);
  const ordered = effective
    .map((event, index) => ({ event, index }))
    .sort(
      (a, b) =>
        a.event.recordedAt.localeCompare(b.event.recordedAt) ||
        a.index - b.index,
    );

  const createdIndex = ordered.findIndex(
    ({ event }) => event.type === 'CASE_CREATED',
  );

  if (createdIndex < 0) {
    throw new MissingCaseCreatedEventError();
  }

  const created = ordered[createdIndex].event;
  const requestedAt = asIsoDate(
    created.payload.requestedAt ?? caseRecord.requestedAt,
    'requestedAt',
  );
  const trigger = asTrigger(created.payload.trigger, caseRecord.trigger);
  const source = asSource(created.payload.source);

  let status: CaseStatus = 'SUSPECTED';

  for (const { event } of ordered.slice(createdIndex + 1)) {
    status = applyEvent(status, event);
  }

  const stateEvents = ordered
    .slice(createdIndex + 1)
    .map(({ event }) => event);

  const reportEvents = stateEvents.filter(
    (event) => event.type === 'REPORT_CONFIRMED',
  );
  const lastReport = reportEvents.at(-1);
  const reportDate = lastReport
    ? asIsoDate(lastReport.payload.reportDate, 'reportDate')
    : null;

  const treatmentEvent = stateEvents
    .filter((event) => event.type === 'TREATMENT_STARTED')
    .at(-1);
  const treatmentStartedAt = treatmentEvent?.occurredAt ?? null;

  const closeEvent = stateEvents
    .filter((event) => event.type === 'CASE_CLOSED_EXCEPTION')
    .at(-1);
  const closedAt = closeEvent?.occurredAt ?? null;
  const closed = isClosedStatus(status);

  const due30 = addDays(requestedAt, DEADLINE_RULES.D30.days);
  const due60 = reportDate
    ? addDays(reportDate, DEADLINE_RULES.D60.days)
    : null;

  const lateEntryDays = Math.max(
    0,
    diffDays(created.recordedAt, due30),
  );
  const lateEntry = lateEntryDays > 0;

  const lastScheduled = stateEvents
    .filter((event) => event.type === 'EXAM_SCHEDULED')
    .at(-1);
  const scheduledFor = lastScheduled
    ? asIsoDate(lastScheduled.payload.scheduledFor, 'scheduledFor')
    : null;

  const lastNews = ordered
    .map(({ event }) => event)
    .filter((event) => NEWS_EVENTS.includes(event.type))
    .at(-1);
  const silenceDays = lastNews
    ? Math.max(0, diffDays(today, lastNews.recordedAt))
    : 0;

  const silenceSuspended =
    status === 'EXAM_SCHEDULED' &&
    scheduledFor !== null &&
    diffDays(scheduledFor, today) >= 0;
  const missedDate =
    status === 'EXAM_SCHEDULED' &&
    scheduledFor !== null &&
    diffDays(today, scheduledFor) > 0;
  const silenceBadge =
    !closed &&
    !silenceSuspended &&
    silenceDays >= DEADLINE_RULES.silenceDays;
  const lackOfNews = missedDate || silenceBadge;

  let clock: 'D30' | 'D60' | null = null;
  let dayTotal: 30 | 60 | null = null;
  let dueDate: IsoDate | null = null;
  let day: number | null = null;
  let daysRemaining: number | null = null;

  if (D30_STATUSES.includes(status)) {
    clock = 'D30';
    dayTotal = 30;
    dueDate = due30;
    day = diffDays(today, requestedAt);
    daysRemaining = diffDays(due30, today);
  } else if (status === 'DIAGNOSIS_CONFIRMED' && reportDate && due60) {
    clock = 'D60';
    dayTotal = 60;
    dueDate = due60;
    day = diffDays(today, reportDate);
    daysRemaining = diffDays(due60, today);
  }

  let color: ComputedCase['color'] = null;

  if (!closed && daysRemaining !== null) {
    const warnWithinDays =
      clock === 'D30'
        ? DEADLINE_RULES.D30.warnWithinDays
        : DEADLINE_RULES.D60.warnWithinDays;

    if (daysRemaining < 0) {
      color = 'red';
    } else if (daysRemaining <= warnWithinDays || lackOfNews) {
      color = 'yellow';
    } else {
      color = 'green';
    }
  }

  const badges: CaseBadge[] = [];

  if (!closed) {
    const exceptionEvent = stateEvents
      .filter((event) => event.type === 'EXCEPTION_NOTED')
      .at(-1);

    if (exceptionEvent) {
      badges.push({
        type: 'EXCEPTION',
        reason: asExceptionReason(exceptionEvent.payload.reason),
        since: exceptionEvent.occurredAt,
      });
    }

    if (silenceBadge) {
      badges.push({ type: 'SILENCE', days: silenceDays });
    }

    if (missedDate && scheduledFor) {
      badges.push({ type: 'MISSED_DATE', scheduledFor });
    }

    if (status === 'REPORT_PENDING_CONFIRMATION') {
      badges.push({ type: 'REPORT_PENDING' });
    }
  }

  if (lateEntry) {
    badges.push({ type: 'LATE_ENTRY', daysLate: lateEntryDays });
  }

  let outcome30: Outcome30 = null;

  if (reportDate && lastReport?.payload.malignancy !== 'inconclusive') {
    outcome30 = outcomeForDate(reportDate, due30);
  } else if (closed && closedAt) {
    outcome30 = outcomeUntilClose(closedAt, due30);
  }

  let outcome60: Outcome60 = null;

  if (reportDate && due60 && treatmentStartedAt) {
    outcome60 = outcomeForDate(treatmentStartedAt, due60);
  } else if (status === 'DISCARDED') {
    outcome60 = 'NOT_APPLICABLE';
  } else if (closed && closedAt) {
    outcome60 = reportDate && due60
      ? outcomeUntilClose(closedAt, due60)
      : 'NOT_APPLICABLE';
  }

  let nextStep: ComputedCase['nextStep'] = null;

  switch (status) {
    case 'SUSPECTED':
      nextStep = {
        label: 'Aguardando agendamento',
        scheduledFor: null,
        location: null,
      };
      break;
    case 'EXAM_SCHEDULED':
      nextStep = {
        label: `${String(lastScheduled?.payload.examLabel ?? 'Exame')} agendada`,
        scheduledFor,
        location:
          typeof lastScheduled?.payload.location === 'string'
            ? lastScheduled.payload.location
            : null,
      };
      break;
    case 'EXAM_DONE':
      nextStep = {
        label: 'Aguardando laudo',
        scheduledFor: null,
        location: null,
      };
      break;
    case 'EXAM_TO_RESCHEDULE':
      nextStep = {
        label: 'Repetir biópsia: agendar',
        scheduledFor: null,
        location: null,
      };
      break;
    case 'REPORT_PENDING_CONFIRMATION':
      nextStep = {
        label: 'Confirmar laudo',
        scheduledFor: null,
        location: null,
      };
      break;
    case 'DIAGNOSIS_CONFIRMED':
      nextStep = {
        label: 'Iniciar tratamento: aguardando agendamento',
        scheduledFor: null,
        location: null,
      };
      break;
    case 'TREATMENT_STARTED':
    case 'DISCARDED':
    case 'CLOSED_EXCEPTION':
      nextStep = null;
      break;
  }

  return {
    trigger,
    source,
    requestedAt,
    reportDate,
    treatmentStartedAt,
    status,
    clock,
    day,
    dayTotal,
    dueDate,
    daysRemaining,
    color,
    badges,
    nextStep,
    outcome30,
    outcome60,
    closedAt,
    allowedEventTypes: getAllowedEventTypes(status),
  };
}
