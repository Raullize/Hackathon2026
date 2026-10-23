import {
  authResponseSchema,
  loginSchema,
  publicUserSchema,
  registerSchema,
} from '@hackathon/contracts';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class PublicUserDto extends createZodDto(publicUserSchema) {}
export class AuthResponseDto extends createZodDto(authResponseSchema) {}
