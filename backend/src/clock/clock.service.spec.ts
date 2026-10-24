import { PrismaService } from '../prisma/prisma.service';
import { ClockService } from './clock.service';

function createClock(): ClockService {
  const prisma = {
    demoClockState: { findUnique: jest.fn().mockResolvedValue({ offsetDays: 0 }) },
  } as unknown as PrismaService;
  return new ClockService(prisma);
}

describe('ClockService', () => {
  it('uses America/Sao_Paulo for the local date', () => {
    const clock = createClock();
    expect(clock.toLocalDate(new Date('2026-10-24T02:30:00Z'))).toBe('2026-10-23');
    expect(clock.toLocalDate(new Date('2026-10-24T03:30:00Z'))).toBe('2026-10-24');
  });

  it('applies the demo offset to now and today', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-23T15:00:00Z'));
    const clock = createClock();
    clock.setOffsetDays(7);

    expect(clock.today()).toBe('2026-10-30');
    expect(clock.getOffsetDays()).toBe(7);
    jest.useRealTimers();
  });
});
