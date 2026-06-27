import type { ChatConversation } from '../types/chatTypes';
import { supabase } from './supabaseClient';

export const chatDatabaseService = {
  fetchConversations: async (bookId: string | null): Promise<ChatConversation[]> => {
    if (!bookId) return [];
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('book_id', bookId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch AI conversations from database:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        messages: Array.isArray(row.messages) ? row.messages : []
      }));
    } catch (e) {
      console.error('Error fetching AI conversations:', e);
      return [];
    }
  },

  saveConversation: async (bookId: string | null, conversation: ChatConversation): Promise<void> => {
    if (!bookId) return;
    try {
      const payload: any = {
        id: conversation.id,
        book_id: bookId,
        title: conversation.title,
        messages: conversation.messages,
        updated_at: new Date(conversation.updatedAt || Date.now()).toISOString()
      };

      const { error } = await supabase
        .from('ai_conversations')
        .upsert(payload);

      if (error) {
        console.warn('Could not save AI conversation to database:', error.message);
      }
    } catch (e) {
      console.error('Error saving AI conversation:', e);
    }
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.warn('Could not delete AI conversation from database:', error.message);
      }
    } catch (e) {
      console.error('Error deleting AI conversation:', e);
    }
  }
};
