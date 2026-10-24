import type { CaseView } from '@careflow/contracts';
import {
  addDays,
  formatDateBr,
  groupCases,
  startOfWeekMonday,
  casesUrl,
} from './calendar-utils';

function caseView(overrides: Partial<CaseView>): CaseView {
  return {
    id: 'case-1',
    fullName: 'Maria Fictícia da Silva',
    initials: 'M.F.S.',
    trigger: 'BIRADS_5',
    status: 'SUSPECTED',
    source: 'UBS_BRIDGE',
    requestedAt: '2026-10-01',
    reportDate: null,
    treatmentStartedAt: null,
    clock: 'D30',
    day: 18,
    dayTotal: 30,
    dueDate: '2026-10-31',
    daysRemaining: 7,
    color: 'yellow',
    badges: [],
    nextStep: { label: 'Aguardando agendamento', scheduledFor: null, location: null },
    outcome30: null,
    outcome60: null,
    closedAt: null,
    allowedEventTypes: [],
    ...overrides,
  };
}

describe('calendar-utils', () => {
  it('finds the Monday of the current week', () => {
    expect(startOfWeekMonday('2026-10-24')).toBe('2026-10-19');
    expect(startOfWeekMonday('2026-10-19')).toBe('2026-10-19');
    expect(startOfWeekMonday('2026-10-25')).toBe('2026-10-19');
  });

  it('groups overdue, current week, future weeks and later', () => {
    const today = '2026-10-24';
    const groups = groupCases(
      [
        caseView({ id: 'overdue', dueDate: '2026-10-20' }),
        caseView({ id: 'current', dueDate: '2026-10-24' }),
        caseView({ id: 'next', dueDate: addDays('2026-10-24', 8) }),
        caseView({ id: 'later', dueDate: addDays('2026-10-24', 100) }),
      ],
      today,
    );

    expect(groups.overdue.map((item) => item.id)).toEqual(['overdue']);
    expect(groups.weeks[0]?.cases.map((item) => item.id)).toEqual(['current']);
    expect(groups.weeks[1]?.cases.map((item) => item.id)).toEqual(['next']);
    expect(groups.later.map((item) => item.id)).toEqual(['later']);
  });

  it('sorts by color, days remaining and trigger', () => {
    const groups = groupCases(
      [
        caseView({ id: 'green', dueDate: '2026-10-30', color: 'green', daysRemaining: 6 }),
        caseView({ id: 'red', dueDate: '2026-10-30', color: 'red', daysRemaining: 6 }),
        caseView({ id: 'yellow', dueDate: '2026-10-30', color: 'yellow', daysRemaining: 6 }),
      ],
      '2026-10-24',
    );

    expect(groups.weeks[1]?.cases.map((item) => item.id)).toEqual([
      'red',
      'yellow',
      'green',
    ]);
  });

  it('builds the cases query with optional search', () => {
    expect(casesUrl('open', '')).toBe('/cases?scope=open');
    expect(casesUrl('closed', 'Maria Silva')).toBe(
      '/cases?scope=closed&q=Maria+Silva',
    );
  });

  it('formats dates for the UI', () => {
    expect(formatDateBr('2026-10-05')).toBe('05/10/2026');
    expect(formatDateBr(null)).toBe('—');
  });
});
