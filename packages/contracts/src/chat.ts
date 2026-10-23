import { z } from 'zod';

export const chatRoleSchema = z.enum(['user', 'assistant']);

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().trim().min(1).max(4000),
});

export const chatRequestSchema = z
  .object({
    messages: z.array(chatMessageSchema).min(1).max(20),
  })
  .refine(
    (input) =>
      input.messages.reduce((total, message) => total + message.content.length, 0) <=
      16000,
    {
      message: 'O histórico total não pode passar de 16.000 caracteres',
      path: ['messages'],
    },
  );

export const chatResponseSchema = z.object({
  message: z.string(),
  model: z.string(),
  provider: z.enum(['gemini', 'mock']),
});

export type ChatRole = z.infer<typeof chatRoleSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
