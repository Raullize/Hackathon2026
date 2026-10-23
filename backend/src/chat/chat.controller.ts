import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { ChatResponse } from '@hackathon/contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Envia um histórico de mensagens para o assistente',
    description:
      'Requer autenticação. Usa Gemini quando configurado e cai para mock em falhas.',
  })
  @ApiOkResponse({ type: ChatResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado' })
  generate(@Body() input: ChatRequestDto): Promise<ChatResponse> {
    return this.chat.generate(input.messages);
  }
}
