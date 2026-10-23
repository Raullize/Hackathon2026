import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthResponse, PublicUser } from '@hackathon/contracts';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/authenticated-request';
import type { AppEnv } from '../config/env';
import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  LoginDto,
  PublicUserDto,
  RegisterDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Cria uma conta e devolve um access token' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(
    @Body() input: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.auth.register(input);
    this.setAccessCookie(response, result.accessToken);
    return result;
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica uma conta existente' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.auth.login(input);
    this.setAccessCookie(response, result.accessToken);
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuário autenticado' })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado' })
  me(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.auth.me(user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Encerra a sessão no cliente e limpa o cookie' })
  logout(@Res({ passthrough: true }) response: Response): { success: true } {
    response.clearCookie('access_token', { path: '/' });
    return { success: true };
  }

  private setAccessCookie(response: Response, accessToken: string): void {
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
