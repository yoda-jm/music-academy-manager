import apiClient from './client';
import { Family, FamilyMember, PaginatedResponse, PaginationParams } from '@/types';

export interface CreateFamilyData {
  name: string;
  billingAddress?: string;
  billingCity?: string;
  billingPostal?: string;
}

export interface UpdateFamilyData {
  name?: string;
  billingAddress?: string;
  billingCity?: string;
  billingPostal?: string;
}

export interface AddFamilyMemberData {
  userId: string;
  relation?: string;
  isPrimary?: boolean;
}

export interface UpdateFamilyMemberData {
  relation?: string;
  isPrimary?: boolean;
}

export const familiesApi = {
  getFamilies: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PaginatedResponse<Family>> => {
    const response = await apiClient.get<PaginatedResponse<Family>>('/families', { params });
    return response.data;
  },

  getFamily: async (id: string): Promise<Family> => {
    const response = await apiClient.get<Family>(`/families/${id}`);
    return response.data;
  },

  createFamily: async (data: CreateFamilyData): Promise<Family> => {
    const response = await apiClient.post<Family>('/families', data);
    return response.data;
  },

  updateFamily: async (id: string, data: UpdateFamilyData): Promise<Family> => {
    const response = await apiClient.patch<Family>(`/families/${id}`, data);
    return response.data;
  },

  deleteFamily: async (id: string): Promise<void> => {
    await apiClient.delete(`/families/${id}`);
  },

  addMember: async (familyId: string, data: AddFamilyMemberData): Promise<FamilyMember> => {
    const response = await apiClient.post<FamilyMember>(`/families/${familyId}/members`, data);
    return response.data;
  },

  updateMember: async (familyId: string, userId: string, data: UpdateFamilyMemberData): Promise<FamilyMember> => {
    const response = await apiClient.patch<FamilyMember>(`/families/${familyId}/members/${userId}`, data);
    return response.data;
  },

  removeMember: async (familyId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/families/${familyId}/members/${userId}`);
  },
};
