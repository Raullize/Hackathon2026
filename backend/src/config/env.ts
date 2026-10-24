import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('8h'),

  LLM_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),

  THROTTLE_TTL: z.coerce.number().int().positive().default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),

  DEMO_MODE: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .default('false')
    .transform((value) => value === true || value === 'true'),
  REPORT_EXTRACTION_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(8000),
}).superRefine((env, ctx) => {
  if (env.DEMO_MODE && env.NODE_ENV === 'production') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DEMO_MODE'],
      message: 'DEMO_MODE cannot be enabled in production',
    });
  }
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment variables: ${details}`);
  }

  return parsed.data;
}
