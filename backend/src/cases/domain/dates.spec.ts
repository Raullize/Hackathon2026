import {
  addDays,
  diffDays,
  fromDayNumber,
  isValidIsoDate,
  toDayNumber,
} from './dates';

describe('dates', () => {
  it('converts an ISO date to an integer day number', () => {
    expect(toDayNumber('1970-01-01')).toBe(0);
    expect(toDayNumber('1970-01-02')).toBe(1);
    expect(toDayNumber('2026-10-05')).toBe(20731);
  });

  it('converts a day number back to ISO date', () => {
    expect(fromDayNumber(0)).toBe('1970-01-01');
    expect(fromDayNumber(20731)).toBe('2026-10-05');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-05', 30)).toBe('2026-11-04');
    expect(addDays('2026-12-29', 3)).toBe('2027-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('calculates the difference in whole days', () => {
    expect(diffDays('2026-11-05', '2026-10-05')).toBe(31);
    expect(diffDays('2026-10-05', '2026-10-05')).toBe(0);
    expect(diffDays('2026-10-04', '2026-10-05')).toBe(-1);
  });

  it('rejects invalid ISO dates', () => {
    expect(isValidIsoDate('2026-10-05')).toBe(true);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('05/10/2026')).toBe(false);
  });
});
