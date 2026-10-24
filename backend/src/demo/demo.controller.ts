import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DemoAdvanceDto } from './demo.dto';
import { DemoService, type DemoStatus } from './demo.service';

@ApiTags('demo')
@ApiBearerAuth()
@Controller('demo')
@UseGuards(JwtAuthGuard)
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Get('status')
  @ApiOperation({ summary: 'Mostra a data simulada e o offset' })
  @ApiOkResponse({ description: 'Status da demo' })
  status(): Promise<DemoStatus> {
    return this.demo.status();
  }

  @Post('clock/advance')
  @ApiOperation({ summary: 'Avança o relógio da demo' })
  advance(@Body() input: DemoAdvanceDto): Promise<DemoStatus> {
    return this.demo.advance(input.days);
  }

  @Post('clock/reset')
  @ApiOperation({ summary: 'Zera o relógio da demo' })
  reset(): Promise<DemoStatus> {
    return this.demo.resetClock();
  }
}
