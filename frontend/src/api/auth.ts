import apiClient from './client';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

// Auth endpoint returns { user, accessToken, refreshToken } — remap to AuthResponse shape
function toAuthResponse(raw: { user: User; accessToken: string; refreshToken: string }): AuthResponse {
  return { user: raw.user, tokens: { accessToken: raw.accessToken, refreshToken: raw.refreshToken } };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return toAuthResponse(response.data);
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return toAuthResponse(response.data);
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return toAuthResponse(response.data);
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
