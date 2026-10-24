import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { CaseIntakeModule } from './case-intake/case-intake.module';
import { CasesModule } from './cases/cases.module';
import { ClockModule } from './clock/clock.module';
import { DemoModule } from './demo/demo.module';
import { MetricsModule } from './metrics/metrics.module';
import { PatientAccessModule } from './patient-access/patient-access.module';
import { validateEnv } from './config/env';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    ClockModule,
    AuthModule,
    HealthModule,
    CasesModule,
    CaseIntakeModule,
    DemoModule,
    AlertsModule,
    MetricsModule,
    PatientAccessModule,
  ],
})
export class AppModule {}
