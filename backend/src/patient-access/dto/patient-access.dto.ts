import {
  accessTokenResponseSchema,
  patientViewSchema,
} from '@careflow/contracts';
import { createZodDto } from 'nestjs-zod';

export class AccessTokenResponseDto extends createZodDto(
  accessTokenResponseSchema,
) {}
export class PatientViewDto extends createZodDto(patientViewSchema) {}
