import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Clock } from '../clock/clock';
import type { AppEnv } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { DemoSeedService } from './demo-seed.service';
import { DemoService } from './demo.service';

function createService(demoMode = true, offsetDays = 0) {
  const prisma = {
    demoClockState: {
      upsert: jest.fn().mockResolvedValue(undefined),
    },
  } as unknown as PrismaService;
  let offset = offsetDays;
  const clock = {
    today: jest.fn(() => '2026-10-23'),
    getOffsetDays: jest.fn(() => offset),
    setOffsetDays: jest.fn((days: number) => {
      offset = days;
    }),
  } as unknown as Clock;
  const config = {
    get: jest.fn((key: keyof AppEnv) => (key === 'DEMO_MODE' ? demoMode : undefined)),
  } as unknown as ConfigService<AppEnv, true>;

  const seed = {
    seed: jest.fn().mockResolvedValue(10),
  } as unknown as DemoSeedService;
  return { service: new DemoService(prisma, clock, config, seed), prisma, clock, seed };
}

describe('DemoService', () => {
  it('returns 404 when demo mode is disabled', async () => {
    const { service } = createService(false);

    await expect(service.status()).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.advance(1)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.resetClock()).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.resetDemo('user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reports the simulated date and offset', async () => {
    const { service } = createService(true, 7);

    await expect(service.status()).resolves.toEqual({
      today: '2026-10-23',
      offsetDays: 7,
    });
  });

  it('advances and resets the clock', async () => {
    const { service, prisma, clock, seed } = createService(true, 0);

    await expect(service.advance(7)).resolves.toEqual({
      today: '2026-10-23',
      offsetDays: 7,
    });
    expect(prisma.demoClockState.upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      update: { offsetDays: 7 },
      create: { id: 1, offsetDays: 7 },
    });
    expect(clock.setOffsetDays).toHaveBeenCalledWith(7);

    await expect(service.resetClock()).resolves.toEqual({
      today: '2026-10-23',
      offsetDays: 0,
    });
    expect(clock.setOffsetDays).toHaveBeenLastCalledWith(0);

    await expect(service.resetDemo('user-1')).resolves.toEqual({ cases: 10 });
    expect(seed.seed).toHaveBeenCalledWith('user-1');
    expect(clock.setOffsetDays).toHaveBeenLastCalledWith(0);
  });

  it('rejects invalid advances', async () => {
    const { service } = createService(true);

    await expect(service.advance(0)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.advance(61)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.advance(1.5)).rejects.toBeInstanceOf(BadRequestException);
  });
});
