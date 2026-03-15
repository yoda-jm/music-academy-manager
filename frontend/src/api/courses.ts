import apiClient from './client';
import {
  Course,
  CourseSession,
  Enrollment,
  PaginatedResponse,
  PaginationParams,
  CourseType,
  PaymentType,
} from '@/types';

export interface CreateCourseData {
  name: string;
  description?: string;
  type: CourseType;
  teacherId: string;
  roomId: string;
  instrumentId?: string;
  maxStudents?: number;
  durationMinutes?: number;
  recurrenceRule?: string;
  pricePerSession?: number;
  priceMonthly?: number;
  priceYearly?: number;
  color?: string;
}

export type UpdateCourseData = Partial<CreateCourseData> & { isActive?: boolean };

export const coursesApi = {
  getCourses: async (
    params?: PaginationParams & {
      type?: CourseType;
      teacherId?: string;
      instrumentId?: string;
      isActive?: boolean;
    }
  ): Promise<PaginatedResponse<Course>> => {
    const response = await apiClient.get<PaginatedResponse<Course>>('/courses', { params });
    return response.data;
  },

  getCourse: async (id: string): Promise<Course> => {
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response.data;
  },

  createCourse: async (data: CreateCourseData): Promise<Course> => {
    const response = await apiClient.post<Course>('/courses', data);
    return response.data;
  },

  updateCourse: async (id: string, data: UpdateCourseData): Promise<Course> => {
    const response = await apiClient.patch<Course>(`/courses/${id}`, data);
    return response.data;
  },

  generateSessions: async (
    id: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<CourseSession[]> => {
    const response = await apiClient.post<CourseSession[]>(`/courses/${id}/generate-sessions`, params);
    return response.data;
  },

  getCourseSessions: async (
    id: string,
    params?: PaginationParams & { status?: string; startDate?: string; endDate?: string }
  ): Promise<PaginatedResponse<CourseSession>> => {
    const response = await apiClient.get<PaginatedResponse<CourseSession>>(
      `/courses/${id}/sessions`,
      { params }
    );
    return response.data;
  },

  getCourseEnrollments: async (id: string): Promise<Enrollment[]> => {
    const response = await apiClient.get<Enrollment[]>(`/courses/${id}/enrollments`);
    return response.data;
  },

  enrollStudent: async (id: string, studentId: string): Promise<Enrollment> => {
    const response = await apiClient.post<Enrollment>(`/courses/${id}/enroll`, { studentId });
    return response.data;
  },

  unenrollStudent: async (id: string, enrollmentId: string): Promise<void> => {
    await apiClient.delete(`/courses/${id}/enrollments/${enrollmentId}`);
  },
};
