import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CasesModule } from '../cases/cases.module';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  imports: [AuthModule, CasesModule],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}
