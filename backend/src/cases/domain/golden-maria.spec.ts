import {
  MARIA_CASE,
  MARIA_REPORT_EVENTS,
  MARIA_TIMELINE,
} from './__fixtures__/maria.timeline';
import { computeCaseStatus } from './compute-case-status';

describe('golden fixture — Maria', () => {
  it('is green on day 18 of 30', () => {
    const result = computeCaseStatus(MARIA_CASE, MARIA_TIMELINE, '2026-10-23');

    expect(result).toMatchObject({
      status: 'EXAM_SCHEDULED',
      clock: 'D30',
      day: 18,
      dueDate: '2026-11-04',
      daysRemaining: 12,
      color: 'green',
    });
    expect(result.badges.some((badge) => badge.type === 'MISSED_DATE')).toBe(
      false,
    );
  });

  it('is yellow on day 25 with missed date and silence badges', () => {
    const result = computeCaseStatus(MARIA_CASE, MARIA_TIMELINE, '2026-10-30');

    expect(result).toMatchObject({
      status: 'EXAM_SCHEDULED',
      clock: 'D30',
      day: 25,
      dueDate: '2026-11-04',
      daysRemaining: 5,
      color: 'yellow',
    });
    expect(result.badges).toContainEqual({
      type: 'MISSED_DATE',
      scheduledFor: '2026-10-25',
    });
    expect(result.badges).toContainEqual({ type: 'SILENCE', days: 10 });
  });

  it('closes D30 and opens D60 at the report date', () => {
    const result = computeCaseStatus(MARIA_CASE, MARIA_REPORT_EVENTS, '2026-10-30');

    expect(result).toMatchObject({
      status: 'DIAGNOSIS_CONFIRMED',
      clock: 'D60',
      day: 0,
      dueDate: '2026-12-29',
      daysRemaining: 60,
      color: 'green',
      reportDate: '2026-10-30',
      outcome30: 'MET',
      outcome60: null,
    });
  });
});
