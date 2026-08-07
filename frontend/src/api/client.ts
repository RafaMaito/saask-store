import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

/**
 * Instância do Cliente HTTP Axios com Interceptadores (Axios HTTP Client Instance with Interceptors)
 */
export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptador de Requisição (Request Interceptor for Bearer Token & Tenant Context Injection)
apiClient.interceptors.request.use((config) => {
  const { token, tenantOverride } = useAuthStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantOverride) {
    config.headers['x-tenant-id'] = tenantOverride;
  }

  return config;
});

// Interceptador de Resposta para Expirar Sessão em 401 (Response Interceptor for Automatic 401 Unauthenticated Logout)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
