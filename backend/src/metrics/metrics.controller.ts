import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Metrics } from '@careflow/contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Métricas calculadas na leitura' })
  @ApiOkResponse({ description: 'Métricas da linha de cuidado' })
  get(): Promise<Metrics> {
    return this.metrics.getMetrics();
  }
}
