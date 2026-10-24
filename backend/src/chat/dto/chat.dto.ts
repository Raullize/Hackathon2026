import { chatRequestSchema, chatResponseSchema } from '@careflow/contracts';
import { createZodDto } from 'nestjs-zod';

export class ChatRequestDto extends createZodDto(chatRequestSchema) {}
export class ChatResponseDto extends createZodDto(chatResponseSchema) {}
