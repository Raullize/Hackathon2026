import {
  caseIntakeRequestSchema,
  caseIntakeViewSchema,
} from '@careflow/contracts';
import { createZodDto } from 'nestjs-zod';

export class CaseIntakeRequestDto extends createZodDto(
  caseIntakeRequestSchema,
) {}
export class CaseIntakeViewDto extends createZodDto(caseIntakeViewSchema) {}
