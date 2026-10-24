import type { Alert } from '@careflow/contracts';
import type { CaseEventRecord, CaseRecord, IsoDate } from './case.types';
import { computeCaseStatus } from './compute-case-status';
import { addDays, diffDays } from './dates';
import { DEADLINE_RULES } from './deadline-rules';

const NEWS_EVENTS = new Set([
  'CASE_CREATED',
  'EXAM_SCHEDULED',
  'EXAM_DONE',
  'REPORT_RECEIVED',
  'REPORT_CONFIRMED',
  'TREATMENT_STARTED',
  'EXCEPTION_NOTED',
]);

type AlertSeed = {
  reason: Alert['reason'];
  recipient: Alert['recipient'];
  action: string;
  referenceDate: IsoDate;
};

const seeds: Record<Alert['reason'], Omit<AlertSeed, 'referenceDate'>> = {
  DEADLINE_WARNING: {
    reason: 'DEADLINE_WARNING',
    recipient: 'NAVIGATOR',
    action: 'Ligar para a paciente e para o serviço',
  },
  SILENCE: {
    reason: 'SILENCE',
    recipient: 'NAVIGATOR',
    action: 'Ligar para a paciente e para o serviço',
  },
  MISSED_DATE: {
    reason: 'MISSED_DATE',
    recipient: 'NAVIGATOR',
    action: 'Confirmar se o exame aconteceu',
  },
  NEAR_DUE: {
    reason: 'NEAR_DUE',
    recipient: 'REGULATION',
    action: 'Priorizar o agendamento no GERCON',
  },
  OVERDUE: {
    reason: 'OVERDUE',
    recipient: 'COORDINATION',
    action: 'Levar o caso para a gestão',
  },
  LATE_ENTRY: {
    reason: 'LATE_ENTRY',
    recipient: 'COORDINATION',
    action: 'Priorizar e apurar a origem da descoberta tardia',
  },
  OVERDUE_NO_CAPACITY: {
    reason: 'OVERDUE_NO_CAPACITY',
    recipient: 'CRS2',
    action: 'Pedir vaga ou redistribuição regional',
  },
};

function buildAlert(
  caseRecord: CaseRecord,
  seed: AlertSeed,
  clock: 'D30' | 'D60',
): Alert {
  const key = `${caseRecord.id}:${seed.reason}:${clock}:${seed.referenceDate}`;
  return {
    key,
    caseId: caseRecord.id,
    fullName: caseRecord.fullName,
    initials: caseRecord.initials,
    reason: seed.reason,
    recipient: seed.recipient,
    action: seed.action,
    clock,
    referenceDate: seed.referenceDate,
    acknowledgedAt: null,
    acknowledgedBy: null,
  };
}

export function buildAlerts(
  caseRecord: CaseRecord,
  events: CaseEventRecord[],
  today: IsoDate,
): Alert[] {
  const computed = computeCaseStatus(caseRecord, events, today);

  if (!computed.clock || !computed.dueDate) {
    return [];
  }

  const clock = computed.clock;
  const dueDate = computed.dueDate;

  const ordered = [...events].sort(
    (a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id),
  );
  const seedsForCase: AlertSeed[] = [];
  const daysRemaining = computed.daysRemaining ?? Number.MAX_SAFE_INTEGER;
  const deadlineWarning =
    daysRemaining >= 0 &&
    daysRemaining <=
      (computed.clock === 'D30'
        ? DEADLINE_RULES.D30.warnWithinDays
        : DEADLINE_RULES.D60.warnWithinDays);

  if (deadlineWarning) {
    seedsForCase.push({ ...seeds.DEADLINE_WARNING, referenceDate: dueDate });
  }

  if (daysRemaining >= 0 && daysRemaining <= 3) {
    seedsForCase.push({ ...seeds.NEAR_DUE, referenceDate: dueDate });
  }

  if (daysRemaining < 0) {
    seedsForCase.push({ ...seeds.OVERDUE, referenceDate: dueDate });
  }

  for (const badge of computed.badges) {
    if (badge.type === 'SILENCE') {
      const lastNews = ordered
        .filter((event) => NEWS_EVENTS.has(event.type))
        .at(-1);
      if (lastNews) {
        seedsForCase.push({
          ...seeds.SILENCE,
          referenceDate: addDays(lastNews.recordedAt, DEADLINE_RULES.silenceDays),
        });
      }
    }
    if (badge.type === 'MISSED_DATE') {
      seedsForCase.push({
        ...seeds.MISSED_DATE,
        referenceDate: badge.scheduledFor,
      });
    }
    if (badge.type === 'LATE_ENTRY') {
      seedsForCase.push({
        ...seeds.LATE_ENTRY,
        referenceDate: computed.dueDate,
      });
    }
  }

  if (daysRemaining < 0) {
    const clockStart =
      computed.clock === 'D60' ? computed.reportDate : computed.requestedAt;
    const latestCapacityException = ordered
      .filter(
        (event) =>
          event.type === 'EXCEPTION_NOTED' &&
          event.payload.reason === 'NO_CAPACITY' &&
          (!clockStart || diffDays(event.recordedAt, clockStart) >= 0),
      )
      .at(-1);

    if (latestCapacityException) {
      seedsForCase.push({
        ...seeds.OVERDUE_NO_CAPACITY,
        referenceDate: computed.dueDate,
      });
    }
  }

  const acknowledged = new Map<string, CaseEventRecord>();
  for (const event of ordered) {
    if (
      event.type === 'ALERT_ACKNOWLEDGED' &&
      typeof event.payload.alertKey === 'string'
    ) {
      acknowledged.set(event.payload.alertKey, event);
    }
  }

  return seedsForCase.map((seed) => {
    const alert = buildAlert(caseRecord, seed, clock);
    const ack = acknowledged.get(alert.key);
    return {
      ...alert,
      acknowledgedAt: ack?.recordedAt ?? null,
      acknowledgedBy: ack?.userId ?? null,
    };
  });
}
