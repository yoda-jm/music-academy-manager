import apiClient from './client';
import {
  Student,
  Enrollment,
  Attendance,
  PaginatedResponse,
  PaginationParams,
  StudentInstrument,
  InstrumentLevel,
  AttendanceReport,
} from '@/types';

export interface CreateStudentData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  familyId?: string;
  notes?: string;
}

export interface UpdateStudentData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  familyId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface StudentInstrumentInput {
  instrumentId: string;
  level: InstrumentLevel;
  startDate?: string;
}

export const studentsApi = {
  getStudents: async (
    params?: PaginationParams & { familyId?: string; instrumentId?: string; isActive?: boolean }
  ): Promise<PaginatedResponse<Student>> => {
    const response = await apiClient.get<PaginatedResponse<Student>>('/students', { params });
    return response.data;
  },

  getStudent: async (id: string): Promise<Student> => {
    const response = await apiClient.get<Student>(`/students/${id}`);
    return response.data;
  },

  createStudent: async (data: CreateStudentData): Promise<Student> => {
    const response = await apiClient.post<Student>('/students', data);
    return response.data;
  },

  updateStudent: async (id: string, data: UpdateStudentData): Promise<Student> => {
    const response = await apiClient.patch<Student>(`/students/${id}`, data);
    return response.data;
  },

  deleteStudent: async (id: string): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },

  getStudentInstruments: async (id: string): Promise<StudentInstrument[]> => {
    const response = await apiClient.get<StudentInstrument[]>(`/students/${id}/instruments`);
    return response.data;
  },

  updateStudentInstruments: async (
    id: string,
    instruments: StudentInstrumentInput[]
  ): Promise<StudentInstrument[]> => {
    const response = await apiClient.put<StudentInstrument[]>(`/students/${id}/instruments`, {
      instruments,
    });
    return response.data;
  },

  getStudentEnrollments: async (id: string): Promise<Enrollment[]> => {
    const response = await apiClient.get<Enrollment[]>(`/students/${id}/enrollments`);
    return response.data;
  },

  getStudentAttendance: async (
    id: string,
    params?: { courseId?: string; startDate?: string; endDate?: string }
  ): Promise<Attendance[]> => {
    const response = await apiClient.get<Attendance[]>(`/students/${id}/attendance`, { params });
    return response.data;
  },

  getStudentAttendanceStats: async (id: string): Promise<AttendanceReport[]> => {
    const response = await apiClient.get<AttendanceReport[]>(`/students/${id}/attendance/stats`);
    return response.data;
  },
};
