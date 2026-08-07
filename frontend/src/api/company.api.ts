import { apiClient } from './client.js';
import { ICompany, IUser } from '../types/index.js';

export interface CreateCompanyPayload {
  name: string;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
}

export interface CreateCompanyResponse {
  message: string;
  company: ICompany;
  adminUser?: IUser;
}

export const companyApi = {
  getCompanies: async (): Promise<{ companies: ICompany[] }> => {
    const { data } = await apiClient.get<{ companies: ICompany[] }>('/companies');
    return data;
  },

  createCompany: async (payload: CreateCompanyPayload): Promise<CreateCompanyResponse> => {
    const { data } = await apiClient.post<CreateCompanyResponse>('/companies', payload);
    return data;
  },

  toggleCompanyStatus: async (id: string, password: string): Promise<{ company: ICompany; message: string }> => {
    const { data } = await apiClient.patch<{ company: ICompany; message: string }>(`/companies/${id}/status`, { password });
    return data;
  },

  deleteCompany: async (id: string, password: string): Promise<{ companyId: string; message: string }> => {
    const { data } = await apiClient.delete<{ companyId: string; message: string }>(`/companies/${id}`, { data: { password } });
    return data;
  },

  getCompanyById: async (id: string): Promise<{ company: ICompany }> => {
    const { data } = await apiClient.get<{ company: ICompany }>(`/companies/${id}`);
    return data;
  },
};
