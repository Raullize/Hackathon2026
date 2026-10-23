import { chatRequestSchema, chatResponseSchema } from '@hackathon/contracts';
import { createZodDto } from 'nestjs-zod';

export class ChatRequestDto extends createZodDto(chatRequestSchema) {}
export class ChatResponseDto extends createZodDto(chatResponseSchema) {}
