import { Controller, Get, Res } from '@nestjs/common';
import type { HealthResponse } from '@hackathon/contracts';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Aplicação viva' })
  liveness(): HealthResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe com ping no PostgreSQL' })
  @ApiOkResponse({ description: 'Aplicação pronta para receber tráfego' })
  async readiness(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthResponse> {
    const databaseUp = await this.prisma.isHealthy();

    if (!databaseUp) {
      response.status(503);
    }

    return {
      status: databaseUp ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: databaseUp ? 'up' : 'down',
    };
  }
}
