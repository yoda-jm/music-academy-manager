import apiClient from './client';
import {
  Teacher,
  TeacherAvailability,
  Course,
  PaginatedResponse,
  PaginationParams,
  TeacherInstrument,
  InstrumentLevel,
} from '@/types';

export interface CreateTeacherData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
  specializations?: string[];
  hireDate?: string;
}

export interface UpdateTeacherData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  specializations?: string[];
  hireDate?: string;
  isActive?: boolean;
}

export interface TeacherInstrumentInput {
  instrumentId: string;
  level: InstrumentLevel;
}

export const teachersApi = {
  getTeachers: async (
    params?: PaginationParams & { isActive?: boolean; instrumentId?: string }
  ): Promise<PaginatedResponse<Teacher>> => {
    const response = await apiClient.get<PaginatedResponse<Teacher>>('/teachers', { params });
    return response.data;
  },

  getTeacher: async (id: string): Promise<Teacher> => {
    const response = await apiClient.get<Teacher>(`/teachers/${id}`);
    return response.data;
  },

  createTeacher: async (data: CreateTeacherData): Promise<Teacher> => {
    const response = await apiClient.post<Teacher>('/teachers', data);
    return response.data;
  },

  updateTeacher: async (id: string, data: UpdateTeacherData): Promise<Teacher> => {
    const response = await apiClient.patch<Teacher>(`/teachers/${id}`, data);
    return response.data;
  },

  deleteTeacher: async (id: string): Promise<void> => {
    await apiClient.delete(`/teachers/${id}`);
  },

  getTeacherInstruments: async (id: string): Promise<TeacherInstrument[]> => {
    const response = await apiClient.get<TeacherInstrument[]>(`/teachers/${id}/instruments`);
    return response.data;
  },

  updateTeacherInstruments: async (
    id: string,
    instruments: TeacherInstrumentInput[]
  ): Promise<TeacherInstrument[]> => {
    const response = await apiClient.put<TeacherInstrument[]>(`/teachers/${id}/instruments`, {
      instruments,
    });
    return response.data;
  },

  getTeacherAvailability: async (id: string): Promise<TeacherAvailability[]> => {
    const response = await apiClient.get<TeacherAvailability[]>(`/teachers/${id}/availability`);
    return response.data;
  },

  updateTeacherAvailability: async (
    id: string,
    availability: Omit<TeacherAvailability, 'id' | 'teacherId'>[]
  ): Promise<TeacherAvailability[]> => {
    const response = await apiClient.put<TeacherAvailability[]>(`/teachers/${id}/availability`, {
      availability,
    });
    return response.data;
  },

  getTeacherSchedule: async (
    id: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<Course[]> => {
    const response = await apiClient.get<Course[]>(`/teachers/${id}/schedule`, { params });
    return response.data;
  },
};
