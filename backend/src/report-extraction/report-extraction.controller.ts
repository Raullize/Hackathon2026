import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { ReportExtractionView } from '@careflow/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/authenticated-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ExtractReportDto,
  ReportExtractionViewDto,
} from './dto/report-extraction.dto';
import { ReportExtractionService } from './report-extraction.service';

@ApiTags('report-extraction')
@ApiBearerAuth()
@Controller('cases')
@UseGuards(JwtAuthGuard)
export class ReportExtractionController {
  constructor(private readonly extractions: ReportExtractionService) {}

  @Post(':id/report-extractions')
  @HttpCode(201)
  @ApiOperation({ summary: 'Sugere os campos estruturados de um laudo' })
  @ApiCreatedResponse({ type: ReportExtractionViewDto })
  extract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: ExtractReportDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ReportExtractionView> {
    return this.extractions.extract(id, input.reportText, user.id);
  }
}
