import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { PatientView } from '@careflow/contracts';
import { PatientViewDto } from './dto/patient-access.dto';
import { PatientAccessService } from './patient-access.service';

@ApiTags('patient-access')
@Controller('public/p')
export class PublicPatientController {
  constructor(private readonly access: PatientAccessService) {}

  @Get(':token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Visão pública e somente leitura da paciente' })
  @ApiOkResponse({ type: PatientViewDto })
  get(@Param('token') token: string): Promise<PatientView> {
    return this.access.getPublicView(token);
  }
}
