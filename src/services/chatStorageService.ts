import type { ChatConversation } from '../types/chatTypes';

const STORAGE_KEY = 'novelsynth_ai_conversations_v1';
const ACTIVE_CONV_KEY = 'novelsynth_active_conversation_id_v1';

export const chatStorageService = {
  getConversations: (): ChatConversation[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load conversations from storage:', e);
      return [];
    }
  },

  saveConversations: (conversations: ChatConversation[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations to storage:', e);
    }
  },

  getActiveConversationId: (): string | null => {
    try {
      return localStorage.getItem(ACTIVE_CONV_KEY);
    } catch (e) {
      return null;
    }
  },

  setActiveConversationId: (id: string | null): void => {
    try {
      if (id) {
        localStorage.setItem(ACTIVE_CONV_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_CONV_KEY);
      }
    } catch (e) {
      console.error('Failed to set active conversation ID:', e);
    }
  }
};
