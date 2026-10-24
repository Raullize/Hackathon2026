import {
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
import type { AccessTokenResponse } from '@careflow/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/authenticated-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenResponseDto } from './dto/patient-access.dto';
import { PatientAccessService } from './patient-access.service';

@ApiTags('patient-access')
@ApiBearerAuth()
@Controller('cases')
@UseGuards(JwtAuthGuard)
export class PatientAccessController {
  constructor(private readonly access: PatientAccessService) {}

  @Post(':id/access-tokens')
  @HttpCode(201)
  @ApiOperation({ summary: 'Gera um link temporário para a paciente' })
  @ApiCreatedResponse({ type: AccessTokenResponseDto })
  createToken(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<AccessTokenResponse> {
    return this.access.createToken(id, user.id);
  }
}
