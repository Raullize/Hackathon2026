import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../../.env'), quiet: true });
config({ path: resolve(__dirname, '../.env'), quiet: true });

process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= 'e2e-test-secret-at-least-32-characters-long';
process.env.LLM_PROVIDER = 'mock';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';
process.env.DATABASE_URL ??=
  'postgresql://hackathon:hackathon@localhost:5432/hackathon?schema=public';
