const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function assertIsoDate(value: string, field = 'date'): void {
  if (!isValidIsoDate(value)) {
    throw new Error(`${field} must be a valid YYYY-MM-DD date`);
  }
}

export function toDayNumber(value: string): number {
  assertIsoDate(value);

  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

export function fromDayNumber(dayNumber: number): string {
  if (!Number.isInteger(dayNumber)) {
    throw new Error('dayNumber must be an integer');
  }

  const date = new Date(dayNumber * MS_PER_DAY);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function addDays(value: string, days: number): string {
  if (!Number.isInteger(days)) {
    throw new Error('days must be an integer');
  }

  return fromDayNumber(toDayNumber(value) + days);
}

export function diffDays(later: string, earlier: string): number {
  return toDayNumber(later) - toDayNumber(earlier);
}
