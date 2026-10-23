import type { ChatMessage, ChatResponse } from '@hackathon/contracts';

export interface ChatProvider {
  generate(messages: ChatMessage[]): Promise<ChatResponse>;
}
