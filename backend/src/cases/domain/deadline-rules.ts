export const DEADLINE_RULES = {
  D30: {
    days: 30,
    warnWithinDays: 7,
  },
  D60: {
    days: 60,
    warnWithinDays: 14,
  },
  silenceDays: 7,
  escalateToRegulationWithinDays: 3,
  closedLinkGraceDays: 30,
} as const;
