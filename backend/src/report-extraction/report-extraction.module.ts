import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IdentifierFilter } from './identifier-filter';
import { PrismaReportExtractionRepository } from './infrastructure/prisma-report-extraction.repository';
import { GeminiReportExtractor } from './providers/gemini-report.extractor';
import { MockReportExtractor } from './providers/mock-report.extractor';
import { REPORT_EXTRACTION_REPOSITORY } from './report-extraction.repository';
import { ReportExtractionController } from './report-extraction.controller';
import { ReportExtractionService } from './report-extraction.service';

@Module({
  imports: [AuthModule],
  controllers: [ReportExtractionController],
  providers: [
    ReportExtractionService,
    IdentifierFilter,
    MockReportExtractor,
    GeminiReportExtractor,
    {
      provide: REPORT_EXTRACTION_REPOSITORY,
      useClass: PrismaReportExtractionRepository,
    },
  ],
  exports: [REPORT_EXTRACTION_REPOSITORY],
})
export class ReportExtractionModule {}
