import apiClient from './client';
import { Event, EventParticipant, EventFile, EventParticipantRole, EventFileType } from '@/types';

export interface CreateEventData {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  location?: string;
  isPublic?: boolean;
}

export interface AddParticipantData {
  userId: string;
  role?: EventParticipantRole;
  notes?: string;
}

export const eventsApi = {
  getEvents: async (params?: { upcoming?: boolean }): Promise<Event[]> => {
    const response = await apiClient.get<Event[]>('/events', { params });
    return response.data;
  },

  getEvent: async (id: string): Promise<Event> => {
    const response = await apiClient.get<Event>(`/events/${id}`);
    return response.data;
  },

  createEvent: async (data: CreateEventData): Promise<Event> => {
    const response = await apiClient.post<Event>('/events', data);
    return response.data;
  },

  updateEvent: async (id: string, data: Partial<CreateEventData>): Promise<Event> => {
    const response = await apiClient.patch<Event>(`/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },

  addParticipant: async (eventId: string, data: AddParticipantData): Promise<EventParticipant> => {
    const response = await apiClient.post<EventParticipant>(`/events/${eventId}/participants`, data);
    return response.data;
  },

  removeParticipant: async (eventId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/participants/${userId}`);
  },

  uploadFile: async (eventId: string, file: File, fileType: EventFileType): Promise<EventFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    const response = await apiClient.post<EventFile>(`/events/${eventId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteFile: async (eventId: string, fileId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/files/${fileId}`);
  },
};
