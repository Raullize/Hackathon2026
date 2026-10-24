import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Alert } from '@careflow/contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AlertsService } from './alerts.service';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os alertas calculados na leitura' })
  @ApiOkResponse({ description: 'Alertas da navegadora' })
  list(): Promise<Alert[]> {
    return this.alerts.list();
  }
}
