import apiClient from './client';
import { Vacation, VacationType } from '@/types';

export interface CreateVacationData {
  name: string;
  startDate: string;
  endDate: string;
  type?: VacationType;
  affectsCourses?: boolean;
  color?: string;
}

export type UpdateVacationData = Partial<CreateVacationData>;

export const vacationsApi = {
  getVacations: async (params?: {
    startDate?: string;
    endDate?: string;
    year?: number;
    type?: VacationType;
    teacherId?: string;
  }): Promise<Vacation[]> => {
    const response = await apiClient.get('/vacations', { params });
    const result = response.data as any;
    // Paginated responses are transformed to { ...meta, data: [] } by the interceptor
    return Array.isArray(result) ? result : (result?.data ?? []);
  },

  createVacation: async (data: CreateVacationData): Promise<Vacation> => {
    const response = await apiClient.post<Vacation>('/vacations', data);
    return response.data;
  },

  updateVacation: async (id: string, data: UpdateVacationData): Promise<Vacation> => {
    const response = await apiClient.patch<Vacation>(`/vacations/${id}`, data);
    return response.data;
  },

  deleteVacation: async (id: string): Promise<void> => {
    await apiClient.delete(`/vacations/${id}`);
  },
};
