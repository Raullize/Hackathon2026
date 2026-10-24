import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

config({ path: resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

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

  console.log(`Seed concluído: ${user.email}`);
}

main()
  .catch((error: unknown) => {
    console.error('Falha no seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
