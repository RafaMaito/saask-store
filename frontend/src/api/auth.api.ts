import { apiClient } from './client.js';
import { IUser } from '../types/index.js';

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  role?: string;
}

export interface IAuthResponse {
  message: string;
  token: string;
  user: IUser;
}

export const authApi = {
  login: async (payload: ILoginPayload): Promise<IAuthResponse> => {
    const { data } = await apiClient.post<IAuthResponse>('/auth/login', payload);
    return data;
  },

  register: async (payload: IRegisterPayload): Promise<IAuthResponse> => {
    const { data } = await apiClient.post<IAuthResponse>('/auth/register', payload);
    return data;
  },

  getMe: async (): Promise<{ user: IUser }> => {
    const { data } = await apiClient.get<{ user: IUser }>('/auth/me');
    return data;
  },
};
