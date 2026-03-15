import apiClient from './client';
import { Conversation, Message, ConvType } from '@/types';

export interface CreateConversationData {
  type: ConvType;
  title?: string;
  participantIds: string[];
  initialMessage?: string;
}

export interface SendMessageData {
  content: string;
}

export interface EditMessageData {
  content: string;
}

export interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const messagingApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get('/messaging/conversations');
    const result = response.data as any;
    const conversations = Array.isArray(result) ? result : (result?.data ?? []);
    // Backend returns messages[] (the latest message array); map to lastMessage for the UI
    return conversations.map((c: any) => ({
      ...c,
      lastMessage: c.lastMessage ?? c.messages?.[0] ?? undefined,
    }));
  },

  createConversation: async (data: CreateConversationData): Promise<Conversation> => {
    const response = await apiClient.post<Conversation>('/messaging/conversations', data);
    return response.data;
  },

  getMessages: async (
    conversationId: string,
    params?: { cursor?: string; limit?: number }
  ): Promise<MessagesResponse> => {
    const response = await apiClient.get<MessagesResponse>(
      `/messaging/conversations/${conversationId}/messages`,
      { params }
    );
    return response.data;
  },

  sendMessage: async (conversationId: string, data: SendMessageData): Promise<Message> => {
    const response = await apiClient.post<Message>(
      `/messaging/conversations/${conversationId}/messages`,
      data
    );
    return response.data;
  },

  editMessage: async (
    conversationId: string,
    messageId: string,
    data: EditMessageData
  ): Promise<Message> => {
    const response = await apiClient.patch<Message>(
      `/messaging/messages/${messageId}`,
      data
    );
    return response.data;
  },

  deleteMessage: async (conversationId: string, messageId: string): Promise<void> => {
    await apiClient.delete(`/messaging/messages/${messageId}`);
  },

  markConversationRead: async (conversationId: string): Promise<void> => {
    await apiClient.post(`/messaging/conversations/${conversationId}/read`);
  },
};
