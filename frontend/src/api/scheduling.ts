import apiClient from './client';
import { CourseSession, CalendarEvent, ScheduleConflict, SessionStatus } from '@/types';

export interface CalendarParams {
  start: string;
  end: string;
  teacherId?: string;
  roomId?: string;
  studentId?: string;
  courseType?: string;
}

export interface UpdateSessionData {
  startTime?: string;
  endTime?: string;
  status?: SessionStatus;
  roomId?: string;
  teacherId?: string;
  notes?: string;
  cancelReason?: string;
}

export const schedulingApi = {
  getCalendarEvents: async (params: CalendarParams): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<any[]>('/scheduling/calendar', { params });
    const sessions: any[] = Array.isArray(response.data) ? response.data : [];
    return sessions.map((s) => ({
      id: s.id,
      title: s.course?.name || 'Session',
      start: new Date(s.startTime),
      end: new Date(s.endTime),
      resource: s,
      type: 'session' as const,
      courseType: s.course?.type,
      color: undefined,
    }));
  },

  getSession: async (id: string): Promise<CourseSession> => {
    const response = await apiClient.get<CourseSession>(`/scheduling/sessions/${id}`);
    return response.data;
  },

  updateSession: async (id: string, data: UpdateSessionData): Promise<CourseSession> => {
    const response = await apiClient.patch<CourseSession>(`/scheduling/sessions/${id}`, data);
    return response.data;
  },

  checkConflicts: async (params: {
    teacherId?: string;
    roomId?: string;
    startTime: string;
    endTime: string;
    excludeSessionId?: string;
  }): Promise<ScheduleConflict[]> => {
    const response = await apiClient.post<ScheduleConflict[]>('/scheduling/check-conflicts', params);
    return response.data;
  },
};
