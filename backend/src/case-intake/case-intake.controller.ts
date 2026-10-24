import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { CaseIntakeView } from '@careflow/contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaseIntakeService } from './case-intake.service';
import { CaseIntakeRequestDto, CaseIntakeViewDto } from './dto/case-intake.dto';

@ApiTags('case-intake')
@ApiBearerAuth()
@Controller('case-intake')
@UseGuards(JwtAuthGuard)
export class CaseIntakeController {
  constructor(private readonly intake: CaseIntakeService) {}

  @Post('extractions')
  @HttpCode(201)
  @ApiOperation({ summary: 'Sugere campos a partir do texto do pedido' })
  @ApiCreatedResponse({ type: CaseIntakeViewDto })
  extract(@Body() input: CaseIntakeRequestDto): Promise<CaseIntakeView> {
    return this.intake.extract(input.requestText);
  }
}
