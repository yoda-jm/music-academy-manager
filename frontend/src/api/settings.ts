import apiClient from './client';

export interface AcademyConfig {
  id: string;
  openTime: number;   // hour 0-23
  closeTime: number;  // hour 0-23
  openDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  updatedAt: string;
}

export interface UpdateAcademyConfigData {
  openTime?: number;
  closeTime?: number;
  openDays?: number[];
}

export const settingsApi = {
  getAcademyConfig: async (): Promise<AcademyConfig> => {
    const response = await apiClient.get<AcademyConfig>('/settings/academy');
    return response.data;
  },

  updateAcademyConfig: async (data: UpdateAcademyConfigData): Promise<AcademyConfig> => {
    const response = await apiClient.patch<AcademyConfig>('/settings/academy', data);
    return response.data;
  },
};
