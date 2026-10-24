import type { CaseEventType, CaseStatus } from './case.types';
import {
  InvalidTransitionError,
  applyEvent,
  getAllowedEventTypes,
  isClosedStatus,
} from './transitions';

function event(type: CaseEventType, payload: Record<string, unknown> = {}) {
  return { type, payload };
}

describe('transitions', () => {
  it('advances from SUSPECTED to the first stage events', () => {
    expect(applyEvent('SUSPECTED', event('EXAM_SCHEDULED'))).toBe(
      'EXAM_SCHEDULED',
    );
    expect(applyEvent('SUSPECTED', event('EXAM_DONE'))).toBe('EXAM_DONE');
    expect(applyEvent('SUSPECTED', event('REPORT_RECEIVED'))).toBe(
      'REPORT_PENDING_CONFIRMATION',
    );
  });

  it('allows skipping steps up to report pending confirmation', () => {
    expect(applyEvent('SUSPECTED', event('EXAM_DONE'))).toBe('EXAM_DONE');
    expect(applyEvent('SUSPECTED', event('REPORT_RECEIVED'))).toBe(
      'REPORT_PENDING_CONFIRMATION',
    );
  });

  it('allows rescheduling and later completion', () => {
    expect(applyEvent('EXAM_SCHEDULED', event('EXAM_SCHEDULED'))).toBe(
      'EXAM_SCHEDULED',
    );
    expect(applyEvent('EXAM_SCHEDULED', event('EXAM_DONE'))).toBe('EXAM_DONE');
    expect(applyEvent('EXAM_TO_RESCHEDULE', event('EXAM_SCHEDULED'))).toBe(
      'EXAM_SCHEDULED',
    );
  });

  it('decides the destination of REPORT_CONFIRMED by malignancy', () => {
    expect(
      applyEvent(
        'REPORT_PENDING_CONFIRMATION',
        event('REPORT_CONFIRMED', { malignancy: 'malignant' }),
      ),
    ).toBe('DIAGNOSIS_CONFIRMED');
    expect(
      applyEvent(
        'REPORT_PENDING_CONFIRMATION',
        event('REPORT_CONFIRMED', { malignancy: 'benign' }),
      ),
    ).toBe('DISCARDED');
    expect(
      applyEvent(
        'REPORT_PENDING_CONFIRMATION',
        event('REPORT_CONFIRMED', { malignancy: 'inconclusive' }),
      ),
    ).toBe('EXAM_TO_RESCHEDULE');
  });

  it('processes non-state events in any open state', () => {
    for (const status of [
      'SUSPECTED',
      'EXAM_SCHEDULED',
      'EXAM_DONE',
      'EXAM_TO_RESCHEDULE',
      'REPORT_PENDING_CONFIRMATION',
      'DIAGNOSIS_CONFIRMED',
    ] satisfies CaseStatus[]) {
      expect(applyEvent(status, event('EXCEPTION_NOTED'))).toBe(status);
      expect(applyEvent(status, event('ALERT_ACKNOWLEDGED'))).toBe(status);
      expect(applyEvent(status, event('CONTACT_LOGGED'))).toBe(status);
      expect(applyEvent(status, event('CORRECTION'))).toBe(status);
    }
  });

  it('allows correction but nothing else in a closed case', () => {
    for (const status of [
      'TREATMENT_STARTED',
      'DISCARDED',
      'CLOSED_EXCEPTION',
    ] satisfies CaseStatus[]) {
      expect(isClosedStatus(status)).toBe(true);
      expect(applyEvent(status, event('CORRECTION'))).toBe(status);
      expect(() => applyEvent(status, event('EXAM_DONE'))).toThrow(
        InvalidTransitionError,
      );
      expect(() => applyEvent(status, event('CONTACT_LOGGED'))).toThrow(
        InvalidTransitionError,
      );
    }
  });

  it('closes any open case explicitly', () => {
    expect(applyEvent('DIAGNOSIS_CONFIRMED', event('CASE_CLOSED_EXCEPTION'))).toBe(
      'CLOSED_EXCEPTION',
    );
  });

  it('rejects invalid transitions', () => {
    expect(() => applyEvent('SUSPECTED', event('TREATMENT_STARTED'))).toThrow(
      InvalidTransitionError,
    );
    expect(() => applyEvent('EXAM_DONE', event('EXAM_SCHEDULED'))).toThrow(
      InvalidTransitionError,
    );
    expect(() =>
      applyEvent('REPORT_PENDING_CONFIRMATION', event('EXAM_SCHEDULED')),
    ).toThrow(InvalidTransitionError);
    expect(() =>
      applyEvent('DIAGNOSIS_CONFIRMED', event('REPORT_CONFIRMED')),
    ).toThrow(InvalidTransitionError);
  });

  it('lists allowed events per state', () => {
    expect(getAllowedEventTypes('SUSPECTED')).toEqual(
      expect.arrayContaining([
        'EXAM_SCHEDULED',
        'EXAM_DONE',
        'REPORT_RECEIVED',
        'EXCEPTION_NOTED',
        'CASE_CLOSED_EXCEPTION',
        'CORRECTION',
        'ALERT_ACKNOWLEDGED',
        'CONTACT_LOGGED',
      ]),
    );
    expect(getAllowedEventTypes('REPORT_PENDING_CONFIRMATION')).toEqual(
      expect.arrayContaining([
        'REPORT_CONFIRMED',
        'EXCEPTION_NOTED',
        'CORRECTION',
      ]),
    );
    expect(getAllowedEventTypes('TREATMENT_STARTED')).toEqual(['CORRECTION']);
  });
});
