import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { Clock } from '../src/clock/clock';
import { DemoSeedService } from '../src/demo/demo-seed.service';
import { PrismaService } from '../src/prisma/prisma.service';
import type { IsoDate } from '../src/cases/domain/case.types';

config({ path: resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

class SeedClock extends Clock {
  now(): Date {
    return new Date();
  }

  today(): IsoDate {
    return this.toLocalDate(this.now());
  }

  toLocalDate(date: Date): IsoDate {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  getOffsetDays(): number {
    return 0;
  }

  setOffsetDays(): void {}
}

async function main(): Promise<void> {
  const email = (process.env.SEED_USER_EMAIL ?? 'demo@careflow.dev').toLowerCase();
  const password = process.env.SEED_USER_PASSWORD ?? 'demo1234';
  const name = process.env.SEED_USER_NAME ?? 'Demo User';

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash },
  });

  await prisma.demoClockState.upsert({
    where: { id: 1 },
    update: { offsetDays: 0 },
    create: { id: 1, offsetDays: 0 },
  });

  const demo = new DemoSeedService(prisma as unknown as PrismaService, new SeedClock());
  const cases = await demo.seed(user.id);

  console.log(`Seed concluído: ${user.email} (${cases} casos fictícios)`);
}

main()
  .catch((error: unknown) => {
    console.error('Falha no seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
