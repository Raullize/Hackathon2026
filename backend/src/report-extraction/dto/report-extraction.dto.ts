import {
  reportExtractionRequestSchema,
  reportExtractionViewSchema,
} from '@careflow/contracts';
import { createZodDto } from 'nestjs-zod';

export class ExtractReportDto extends createZodDto(
  reportExtractionRequestSchema,
) {}
export class ReportExtractionViewDto extends createZodDto(
  reportExtractionViewSchema,
) {}
