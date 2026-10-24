import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Clock } from '../clock/clock';
import { PrismaService } from '../prisma/prisma.service';
import type { AppEnv } from '../config/env';

export interface DemoStatus {
  today: string;
  offsetDays: number;
}

@Injectable()
export class DemoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  async status(): Promise<DemoStatus> {
    this.assertEnabled();
    return this.current();
  }

  async advance(days: number): Promise<DemoStatus> {
    this.assertEnabled();

    if (!Number.isInteger(days) || days < 1 || days > 60) {
      throw new BadRequestException('days deve ser um inteiro de 1 a 60');
    }

    const nextOffset = this.clock.getOffsetDays() + days;
    await this.saveOffset(nextOffset);
    this.clock.setOffsetDays(nextOffset);
    return this.current();
  }

  async resetClock(): Promise<DemoStatus> {
    this.assertEnabled();
    await this.saveOffset(0);
    this.clock.setOffsetDays(0);
    return this.current();
  }

  private current(): DemoStatus {
    return {
      today: this.clock.today(),
      offsetDays: this.clock.getOffsetDays(),
    };
  }

  private assertEnabled(): void {
    if (!this.config.get('DEMO_MODE', { infer: true })) {
      throw new NotFoundException('Demo mode is disabled');
    }
  }

  private async saveOffset(offsetDays: number): Promise<void> {
    await this.prisma.demoClockState.upsert({
      where: { id: 1 },
      update: { offsetDays },
      create: { id: 1, offsetDays },
    });
  }
}
