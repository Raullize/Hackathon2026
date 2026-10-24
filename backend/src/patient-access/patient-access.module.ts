import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CasesModule } from '../cases/cases.module';
import { PatientAccessController } from './patient-access.controller';
import { PatientAccessService } from './patient-access.service';
import { PublicPatientController } from './public-patient.controller';

@Module({
  imports: [AuthModule, CasesModule],
  controllers: [PatientAccessController, PublicPatientController],
  providers: [PatientAccessService],
})
export class PatientAccessModule {}
