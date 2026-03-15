import apiClient from './client';
import { User, Profile, PaginatedResponse, PaginationParams } from '@/types';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  getUsers: async (params?: PaginationParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<Profile> => {
    const response = await apiClient.patch<Profile>('/users/me/profile', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await apiClient.post('/users/me/change-password', data);
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateUserProfile: async (userId: string, data: UpdateProfileData): Promise<Profile> => {
    const response = await apiClient.patch<Profile>(`/users/${userId}/profile`, data);
    return response.data;
  },

  searchUsers: async (search: string, limit = 10): Promise<User[]> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users', { params: { search, limit } });
    return response.data.data || [];
  },
};
