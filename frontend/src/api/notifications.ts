import apiClient from './client';
import { Notification, PaginatedResponse } from '@/types';

export const notificationsApi = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<PaginatedResponse<Notification>> => {
    const response = await apiClient.get<PaginatedResponse<Notification>>('/notifications', {
      params,
    });
    return response.data;
  },

  markRead: async (id: string): Promise<Notification> => {
    const response = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark-all-read');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },
};
