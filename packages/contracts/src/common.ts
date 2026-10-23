import { z } from 'zod';

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.union([z.string(), z.array(z.string())]),
  path: z.string(),
  timestamp: z.string(),
});

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptime: z.number().nonnegative(),
  timestamp: z.string(),
  database: z.enum(['up', 'down']).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
