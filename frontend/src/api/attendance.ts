import apiClient from './client';
import { Attendance, AttendanceStatus, AttendanceReport } from '@/types';

export interface BulkAttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
}

export const attendanceApi = {
  getSessionAttendance: async (sessionId: string): Promise<Attendance[]> => {
    const response = await apiClient.get<Attendance[]>(`/attendance/sessions/${sessionId}`);
    return response.data;
  },

  bulkUpdateAttendance: async (
    sessionId: string,
    entries: BulkAttendanceEntry[]
  ): Promise<Attendance[]> => {
    const response = await apiClient.put<Attendance[]>(`/attendance/sessions/${sessionId}/bulk`, {
      attendance: entries,
    });
    return response.data;
  },

  updateAttendance: async (
    id: string,
    data: { status: AttendanceStatus; notes?: string }
  ): Promise<Attendance> => {
    const response = await apiClient.patch<Attendance>(`/attendance/${id}`, data);
    return response.data;
  },

  getStudentAttendance: async (
    studentId: string,
    params?: { courseId?: string; startDate?: string; endDate?: string }
  ): Promise<Attendance[]> => {
    const response = await apiClient.get<Attendance[]>(`/attendance/students/${studentId}`, {
      params,
    });
    return response.data;
  },

  getAttendanceStats: async (params?: {
    courseId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceReport[]> => {
    const response = await apiClient.get<AttendanceReport[]>('/attendance/stats', { params });
    return response.data;
  },
};
