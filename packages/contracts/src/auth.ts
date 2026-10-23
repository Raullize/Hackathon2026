import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email()
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: publicUserSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
