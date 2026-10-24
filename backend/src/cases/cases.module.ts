import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReportExtractionModule } from '../report-extraction/report-extraction.module';
import { CasesController } from './cases.controller';
import { CASE_REPOSITORY } from './cases.repository';
import { CasesService } from './cases.service';
import { PrismaCaseRepository } from './infrastructure/prisma-case.repository';

@Module({
  imports: [AuthModule, ReportExtractionModule],
  controllers: [CasesController],
  providers: [
    CasesService,
    {
      provide: CASE_REPOSITORY,
      useClass: PrismaCaseRepository,
    },
  ],
  exports: [CasesService, CASE_REPOSITORY],
})
export class CasesModule {}
