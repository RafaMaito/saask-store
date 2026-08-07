import { apiClient } from './client.js';
import { IProduct, SSEChatEvent } from '../types/index.js';
import { useAuthStore } from '../store/authStore.js';

export interface IChatResponse {
  reply: string;
  productsRetrieved: IProduct[];
  meta: {
    modelUsed: string;
    providerUsed: string;
    timestamp: string;
  };
}

export const chatApi = {
  sendMessage: async (message: string, history: Array<{ role: string; content: string }>): Promise<IChatResponse> => {
    const { data } = await apiClient.post<IChatResponse>('/chat', { message, history });
    return data;
  },

  sendMessageStream: async (
    message: string,
    history: Array<{ role: string; content: string }>,
    onEvent: (event: SSEChatEvent) => void
  ): Promise<void> => {
    const token = useAuthStore.getState().token;
    const tenantOverride = useAuthStore.getState().tenantOverride;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantOverride) headers['x-tenant-id'] = tenantOverride;

    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${baseURL}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, history }),
    });

    if (!response.body) {
      throw new Error('Streaming não suportado pela resposta HTTP.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            onEvent(data);
          } catch (err) {
            console.error('Erro ao decodificar evento SSE:', err);
          }
        }
      }
    }
  },
};
