import apiClient from './client';
import { Room, CourseSession, PaginatedResponse, PaginationParams } from '@/types';

export interface CreateRoomData {
  name: string;
  capacity: number;
  floor?: string;
  building?: string;
  equipment?: string[];
  color?: string;
}

export type UpdateRoomData = Partial<CreateRoomData> & { isActive?: boolean };

export const roomsApi = {
  getRooms: async (
    params?: PaginationParams & { isActive?: boolean }
  ): Promise<PaginatedResponse<Room>> => {
    const response = await apiClient.get<PaginatedResponse<Room>>('/rooms', { params });
    return response.data;
  },

  getRoom: async (id: string): Promise<Room> => {
    const response = await apiClient.get<Room>(`/rooms/${id}`);
    return response.data;
  },

  createRoom: async (data: CreateRoomData): Promise<Room> => {
    const response = await apiClient.post<Room>('/rooms', data);
    return response.data;
  },

  updateRoom: async (id: string, data: UpdateRoomData): Promise<Room> => {
    const response = await apiClient.patch<Room>(`/rooms/${id}`, data);
    return response.data;
  },

  deleteRoom: async (id: string): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },

  getRoomSchedule: async (
    id: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<CourseSession[]> => {
    const response = await apiClient.get<CourseSession[]>(`/rooms/${id}/schedule`, { params });
    return response.data;
  },
};
