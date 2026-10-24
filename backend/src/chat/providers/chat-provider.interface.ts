import type { ChatMessage, ChatResponse } from '@careflow/contracts';

export interface ChatProvider {
  generate(messages: ChatMessage[]): Promise<ChatResponse>;
}
