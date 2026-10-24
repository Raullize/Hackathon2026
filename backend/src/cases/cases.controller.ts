import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { caseEventInputSchema, type CaseCreate, type CaseDetail, type CaseEventInput, type CaseListResponse, type CaseView } from '@careflow/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/authenticated-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CasesService } from './cases.service';
import {
  CaseDetailDto,
  CaseListQueryDto,
  CaseListResponseDto,
  CaseViewDto,
  CreateCaseDto,
} from './dto/case.dto';

@ApiTags('cases')
@ApiBearerAuth()
@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um caso a partir do pedido' })
  @ApiCreatedResponse({ type: CaseViewDto })
  @ApiUnauthorizedResponse()
  create(
    @Body() input: CreateCaseDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CaseView> {
    return this.cases.create(input as unknown as CaseCreate, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lista casos abertos ou fechados' })
  @ApiOkResponse({ type: CaseListResponseDto })
  list(@Query() query: CaseListQueryDto): Promise<CaseListResponse> {
    return this.cases.list(query.scope, query.q, query.page, query.pageSize);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um caso e sua linha do tempo' })
  @ApiOkResponse({ type: CaseDetailDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CaseDetail> {
    return this.cases.findById(id);
  }

  @Post(':id/events')
  @ApiOperation({ summary: 'Registra um evento no caso' })
  @ApiBody({ description: 'CaseEventInput (discriminatedUnion por type)' })
  @ApiCreatedResponse({ type: CaseViewDto })
  appendEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(caseEventInputSchema)) input: CaseEventInput,
    @CurrentUser() user: AuthUser,
  ): Promise<CaseView> {
    return this.cases.appendEvent(id, input, user.id);
  }
}
