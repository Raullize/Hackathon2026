import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { CaseIntakeModule } from './case-intake/case-intake.module';
import { CasesModule } from './cases/cases.module';
import { ChatModule } from './chat/chat.module';
import { ClockModule } from './clock/clock.module';
import { DemoModule } from './demo/demo.module';
import { MetricsModule } from './metrics/metrics.module';
import { PatientAccessModule } from './patient-access/patient-access.module';
import { validateEnv, type AppEnv } from './config/env';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv, true>) => [
        {
          ttl: config.get('THROTTLE_TTL', { infer: true }),
          limit: config.get('THROTTLE_LIMIT', { infer: true }),
        },
      ],
    }),
    PrismaModule,
    ClockModule,
    AuthModule,
    HealthModule,
    ChatModule,
    CasesModule,
    CaseIntakeModule,
    DemoModule,
    AlertsModule,
    MetricsModule,
    PatientAccessModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
