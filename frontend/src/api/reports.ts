import apiClient from './client';
import {
  AttendanceReport,
  RevenueReport,
  StudentStats,
  TeacherHoursReport,
} from '@/types';

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  teacherId?: string;
  courseId?: string;
  studentId?: string;
}

export const reportsApi = {
  getAttendanceReport: async (params?: ReportParams): Promise<AttendanceReport[]> => {
    const response = await apiClient.get<AttendanceReport[]>('/reports/attendance', { params });
    return response.data;
  },

  getRevenueReport: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<RevenueReport[]> => {
    const response = await apiClient.get<RevenueReport[]>('/reports/revenue', { params });
    return response.data;
  },

  getStudentsReport: async (params?: ReportParams): Promise<StudentStats> => {
    const response = await apiClient.get<StudentStats>('/reports/students', { params });
    return response.data;
  },

  getTeacherHoursReport: async (params?: ReportParams): Promise<TeacherHoursReport[]> => {
    const response = await apiClient.get<TeacherHoursReport[]>('/reports/teacher-hours', {
      params,
    });
    return response.data;
  },
};
