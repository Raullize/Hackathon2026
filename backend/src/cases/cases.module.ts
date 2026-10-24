import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CasesController } from './cases.controller';
import { CASE_REPOSITORY } from './cases.repository';
import { CasesService } from './cases.service';
import { PrismaCaseRepository } from './infrastructure/prisma-case.repository';

@Module({
  imports: [AuthModule],
  controllers: [CasesController],
  providers: [
    CasesService,
    {
      provide: CASE_REPOSITORY,
      useClass: PrismaCaseRepository,
    },
  ],
  exports: [CasesService],
})
export class CasesModule {}
