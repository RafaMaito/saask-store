import { apiClient } from './client.js';
import { ISystemConfig } from '../types/index.js';

export const systemApi = {
  getConfig: async (): Promise<{ config: ISystemConfig }> => {
    const { data } = await apiClient.get<{ config: ISystemConfig }>('/system/config');
    return data;
  },

  updateConfig: async (payload: Partial<ISystemConfig>): Promise<{ config: ISystemConfig; message: string }> => {
    const { data } = await apiClient.put<{ config: ISystemConfig; message: string }>('/system/config', payload);
    return data;
  },
};
