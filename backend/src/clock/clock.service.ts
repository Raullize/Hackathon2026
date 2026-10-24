import { Injectable, OnModuleInit } from '@nestjs/common';
import type { IsoDate } from '../cases/domain/case.types';
import { PrismaService } from '../prisma/prisma.service';
import { Clock } from './clock';

const TIME_ZONE = 'America/Sao_Paulo';
const MS_PER_DAY = 86_400_000;

@Injectable()
export class ClockService extends Clock implements OnModuleInit {
  private offsetDays = 0;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    const state = await this.prisma.demoClockState.findUnique({
      where: { id: 1 },
    });
    this.offsetDays = state?.offsetDays ?? 0;
  }

  now(): Date {
    return new Date(Date.now() + this.offsetDays * MS_PER_DAY);
  }

  today(): IsoDate {
    return this.toLocalDate(this.now());
  }

  toLocalDate(date: Date): IsoDate {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) {
      throw new Error('Could not resolve local date');
    }

    return `${year}-${month}-${day}`;
  }

  getOffsetDays(): number {
    return this.offsetDays;
  }

  setOffsetDays(days: number): void {
    this.offsetDays = days;
  }
}
