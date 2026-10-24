import type { IsoDate } from '../cases/domain/case.types';

export abstract class Clock {
  abstract now(): Date;
  abstract today(): IsoDate;
  abstract toLocalDate(date: Date): IsoDate;
  abstract getOffsetDays(): number;
  abstract setOffsetDays(days: number): void;
}
