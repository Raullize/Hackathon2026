import { apiFetch } from '@/lib/api-client';

export interface ClockStatus {
  today: string;
  offsetDays: number;
}

export function getClockStatus(): Promise<ClockStatus> {
  return apiFetch<ClockStatus>('/demo/status');
}

export function advanceClock(days: number): Promise<ClockStatus> {
  return apiFetch<ClockStatus>('/demo/clock/advance', {
    method: 'POST',
    body: JSON.stringify({ days }),
  });
}

export function resetClock(): Promise<ClockStatus> {
  return apiFetch<ClockStatus>('/demo/clock/reset', { method: 'POST' });
}

export function resetDemoData(): Promise<{ cases: number }> {
  return apiFetch<{ cases: number }>('/demo/reset', { method: 'POST' });
}
