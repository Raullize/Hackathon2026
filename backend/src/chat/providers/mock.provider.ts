import { Injectable } from '@nestjs/common';
import type { ChatMessage, ChatResponse } from '@careflow/contracts';
import type { ChatProvider } from './chat-provider.interface';

@Injectable()
export class MockProvider implements ChatProvider {
  async generate(messages: ChatMessage[]): Promise<ChatResponse> {
    const lastUserMessage =
      [...messages].reverse().find((message) => message.role === 'user')
        ?.content ?? '';

    return {
      message:
        `[mock] Recebi sua mensagem: "${lastUserMessage}". ` +
        'Configure GEMINI_API_KEY e LLM_PROVIDER=gemini para usar o modelo real.',
      model: 'mock',
      provider: 'mock',
    };
  }
}
