import type { CaseEventRecord, CaseEventType } from './case.types';
import { isValidIsoDate } from './dates';

const CORRECTABLE_FIELDS: Partial<Record<CaseEventType, readonly string[]>> = {
  CASE_CREATED: ['requestedAt', 'trigger'],
  EXAM_SCHEDULED: ['scheduledFor', 'location', 'examLabel'],
  EXAM_DONE: ['occurredAt', 'examLabel'],
  REPORT_CONFIRMED: ['reportDate', 'examType', 'evidenceQuote'],
  TREATMENT_STARTED: ['occurredAt', 'treatmentType'],
  EXCEPTION_NOTED: ['occurredAt', 'reason', 'note'],
};

const DATE_FIELDS = new Set(['requestedAt', 'scheduledFor', 'reportDate', 'occurredAt']);

export class InvalidCorrectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCorrectionError';
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidCorrectionError('Correction changes must be an object');
  }
  return value as Record<string, unknown>;
}

/**
 * Applies the latest correction per target event and returns a new array.
 * The original records are not mutated.
 */
export function applyCorrections(events: CaseEventRecord[]): CaseEventRecord[] {
  const effective = events.map((event) => ({
    ...event,
    payload: { ...event.payload },
  }));

  const byId = new Map(effective.map((event) => [event.id, event]));
  const indexed = events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event.type === 'CORRECTION')
    .sort(
      (a, b) =>
        a.event.recordedAt.localeCompare(b.event.recordedAt) ||
        a.index - b.index,
    );

  for (const { event: correction } of indexed) {
    const targetId = correction.payload.correctsEventId;
    const changes = asRecord(correction.payload.changes);

    if (typeof targetId !== 'string') {
      throw new InvalidCorrectionError('Correction is missing correctsEventId');
    }

    const target = byId.get(targetId);

    if (!target) {
      throw new InvalidCorrectionError(`Unknown corrected event: ${targetId}`);
    }

    if (target.type === 'CORRECTION') {
      throw new InvalidCorrectionError('A correction cannot correct another correction');
    }

    const allowed = CORRECTABLE_FIELDS[target.type];

    if (!allowed) {
      throw new InvalidCorrectionError(
        `Event type ${target.type} is not correctable`,
      );
    }

    for (const [field, value] of Object.entries(changes)) {
      if (!allowed.includes(field)) {
        throw new InvalidCorrectionError(
          `Field ${field} cannot be corrected on ${target.type}`,
        );
      }

      if (DATE_FIELDS.has(field)) {
        if (typeof value !== 'string' || !isValidIsoDate(value)) {
          throw new InvalidCorrectionError(`Field ${field} must be a valid date`);
        }
      }

      if (field === 'occurredAt') {
        if (typeof value !== 'string') {
          throw new InvalidCorrectionError('occurredAt must be a string');
        }
        target.occurredAt = value;
      } else {
        target.payload[field] = value;
      }
    }
  }

  return effective;
}
