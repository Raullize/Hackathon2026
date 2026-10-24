import {
  caseCreateSchema,
  caseDetailSchema,
  caseListQuerySchema,
  caseListResponseSchema,
  caseViewSchema,
} from '@careflow/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateCaseDto extends createZodDto(caseCreateSchema) {}
export class CaseListQueryDto extends createZodDto(caseListQuerySchema) {}
export class CaseViewDto extends createZodDto(caseViewSchema) {}
export class CaseDetailDto extends createZodDto(caseDetailSchema) {}
export class CaseListResponseDto extends createZodDto(caseListResponseSchema) {}
