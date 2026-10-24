import type { CaseEventRecord, CaseEventType, CaseStatus } from './case.types';

const OPEN_STATUSES: CaseStatus[] = [
  'SUSPECTED',
  'EXAM_SCHEDULED',
  'EXAM_DONE',
  'EXAM_TO_RESCHEDULE',
  'REPORT_PENDING_CONFIRMATION',
  'DIAGNOSIS_CONFIRMED',
];

const CLOSED_STATUSES: CaseStatus[] = [
  'TREATMENT_STARTED',
  'DISCARDED',
  'CLOSED_EXCEPTION',
];

const NON_STATE_EVENTS: CaseEventType[] = [
  'EXCEPTION_NOTED',
  'CORRECTION',
  'ALERT_ACKNOWLEDGED',
  'CONTACT_LOGGED',
];

export class InvalidTransitionError extends Error {
  constructor(
    readonly status: CaseStatus,
    readonly eventType: CaseEventType,
  ) {
    super(`Event ${eventType} is not allowed from status ${status}`);
    this.name = 'InvalidTransitionError';
  }
}

export function isOpenStatus(status: CaseStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

export function isClosedStatus(status: CaseStatus): boolean {
  return CLOSED_STATUSES.includes(status);
}

function allowedStateEvents(status: CaseStatus): CaseEventType[] {
  switch (status) {
    case 'SUSPECTED':
      return ['EXAM_SCHEDULED', 'EXAM_DONE', 'REPORT_RECEIVED'];
    case 'EXAM_SCHEDULED':
      return ['EXAM_SCHEDULED', 'EXAM_DONE', 'REPORT_RECEIVED'];
    case 'EXAM_DONE':
      return ['REPORT_RECEIVED'];
    case 'EXAM_TO_RESCHEDULE':
      return ['EXAM_SCHEDULED', 'EXAM_DONE', 'REPORT_RECEIVED'];
    case 'REPORT_PENDING_CONFIRMATION':
      return ['REPORT_CONFIRMED'];
    case 'DIAGNOSIS_CONFIRMED':
      return ['TREATMENT_STARTED'];
    case 'TREATMENT_STARTED':
    case 'DISCARDED':
    case 'CLOSED_EXCEPTION':
      return [];
  }
}

export function getAllowedEventTypes(status: CaseStatus): CaseEventType[] {
  if (isClosedStatus(status)) {
    return ['CORRECTION'];
  }

  return [...allowedStateEvents(status), ...NON_STATE_EVENTS, 'CASE_CLOSED_EXCEPTION'];
}

export function applyEvent(
  status: CaseStatus,
  event: Pick<CaseEventRecord, 'type' | 'payload'>,
): CaseStatus {
  if (event.type === 'CASE_CREATED') {
    return 'SUSPECTED';
  }

  if (isClosedStatus(status)) {
    if (event.type === 'CORRECTION') {
      return status;
    }

    throw new InvalidTransitionError(status, event.type);
  }

  if (NON_STATE_EVENTS.includes(event.type)) {
    return status;
  }

  if (event.type === 'CASE_CLOSED_EXCEPTION') {
    return 'CLOSED_EXCEPTION';
  }

  if (event.type === 'EXAM_SCHEDULED') {
    if (
      status === 'SUSPECTED' ||
      status === 'EXAM_SCHEDULED' ||
      status === 'EXAM_TO_RESCHEDULE'
    ) {
      return 'EXAM_SCHEDULED';
    }
    throw new InvalidTransitionError(status, event.type);
  }

  if (event.type === 'EXAM_DONE') {
    if (
      status === 'SUSPECTED' ||
      status === 'EXAM_SCHEDULED' ||
      status === 'EXAM_TO_RESCHEDULE'
    ) {
      return 'EXAM_DONE';
    }
    throw new InvalidTransitionError(status, event.type);
  }

  if (event.type === 'REPORT_RECEIVED') {
    if (
      status === 'SUSPECTED' ||
      status === 'EXAM_SCHEDULED' ||
      status === 'EXAM_DONE' ||
      status === 'EXAM_TO_RESCHEDULE'
    ) {
      return 'REPORT_PENDING_CONFIRMATION';
    }
    throw new InvalidTransitionError(status, event.type);
  }

  if (event.type === 'REPORT_CONFIRMED') {
    if (status !== 'REPORT_PENDING_CONFIRMATION') {
      throw new InvalidTransitionError(status, event.type);
    }

    switch (event.payload.malignancy) {
      case 'malignant':
        return 'DIAGNOSIS_CONFIRMED';
      case 'benign':
        return 'DISCARDED';
      case 'inconclusive':
        return 'EXAM_TO_RESCHEDULE';
      default:
        throw new InvalidTransitionError(status, event.type);
    }
  }

  if (event.type === 'TREATMENT_STARTED') {
    if (status === 'DIAGNOSIS_CONFIRMED') {
      return 'TREATMENT_STARTED';
    }
    throw new InvalidTransitionError(status, event.type);
  }

  throw new InvalidTransitionError(status, event.type);
}
