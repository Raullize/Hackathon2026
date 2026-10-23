import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiProvider } from './providers/gemini.provider';
import { MockProvider } from './providers/mock.provider';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, GeminiProvider, MockProvider, JwtAuthGuard],
})
export class ChatModule {}
