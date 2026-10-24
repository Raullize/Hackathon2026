import type { CaseView } from '@careflow/contracts';

const MS_PER_DAY = 86_400_000;

export function toDayNumber(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date((toDayNumber(isoDate) + days) * MS_PER_DAY);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function diffDays(later: string, earlier: string): number {
  return toDayNumber(later) - toDayNumber(earlier);
}

export function startOfWeekMonday(isoDate: string): string {
  const day = new Date(`${isoDate}T00:00:00.000Z`).getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  return addDays(isoDate, -daysSinceMonday);
}

export function todayInSaoPaulo(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function formatDateBr(isoDate: string | null): string {
  if (!isoDate) {
    return '—';
  }
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateShort(isoDate: string | null): string {
  if (!isoDate) {
    return '—';
  }
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

export function formatWeekRange(start: string): string {
  const end = addDays(start, 6);
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}

export interface WeekGroup {
  start: string;
  end: string;
  label: string;
  cases: CaseView[];
}

export interface CalendarGroups {
  overdue: CaseView[];
  weeks: WeekGroup[];
  later: CaseView[];
}

const colorRank: Record<string, number> = { red: 0, yellow: 1, green: 2 };
const triggerRank: Record<string, number> = {
  BIRADS_5: 0,
  BIRADS_4: 1,
  CLINICAL_SUSPICION: 2,
};

function sortCases(cases: CaseView[]): CaseView[] {
  return [...cases].sort((a, b) => {
    const colorDiff =
      (colorRank[a.color ?? 'green'] ?? 2) -
      (colorRank[b.color ?? 'green'] ?? 2);
    if (colorDiff !== 0) return colorDiff;

    const daysDiff =
      (a.daysRemaining ?? Number.MAX_SAFE_INTEGER) -
      (b.daysRemaining ?? Number.MAX_SAFE_INTEGER);
    if (daysDiff !== 0) return daysDiff;

    return (
      (triggerRank[a.trigger] ?? 2) - (triggerRank[b.trigger] ?? 2)
    );
  });
}

export function groupCases(cases: CaseView[], today: string): CalendarGroups {
  const weekStart = startOfWeekMonday(today);
  const weeks: WeekGroup[] = Array.from({ length: 9 }, (_, index) => {
    const start = addDays(weekStart, index * 7);
    return {
      start,
      end: addDays(start, 6),
      label: formatWeekRange(start),
      cases: [],
    };
  });
  const overdue: CaseView[] = [];
  const later: CaseView[] = [];

  for (const item of cases) {
    if (!item.dueDate) {
      later.push(item);
      continue;
    }

    if (item.dueDate < today) {
      overdue.push(item);
      continue;
    }

    const index = Math.floor(diffDays(item.dueDate, weekStart) / 7);
    if (index < 0) {
      overdue.push(item);
    } else if (index >= weeks.length) {
      later.push(item);
    } else {
      weeks[index]!.cases.push(item);
    }
  }

  return {
    overdue: sortCases(overdue),
    weeks: weeks.map((week) => ({ ...week, cases: sortCases(week.cases) })),
    later: sortCases(later),
  };
}
