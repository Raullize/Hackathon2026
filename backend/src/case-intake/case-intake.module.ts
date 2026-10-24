import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CaseIntakeController } from './case-intake.controller';
import { CaseIntakeService } from './case-intake.service';
import { IntakeSanitizer } from './intake-sanitizer';
import { GeminiCaseIntakeExtractor } from './providers/gemini-case-intake.extractor';
import { MockCaseIntakeExtractor } from './providers/mock-case-intake.extractor';

@Module({
  imports: [AuthModule],
  controllers: [CaseIntakeController],
  providers: [
    CaseIntakeService,
    IntakeSanitizer,
    MockCaseIntakeExtractor,
    GeminiCaseIntakeExtractor,
  ],
})
export class CaseIntakeModule {}
