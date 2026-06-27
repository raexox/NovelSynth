export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}
