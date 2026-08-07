/**
 * Papéis do Sistema (System Role Types)
 */
export type UserRole = 'superadmin' | 'admin' | 'user';

/**
 * Interface do Tenant/Empresa (Company Tenant Contract)
 */
export interface ICompany {
  _id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface de Perfil do Usuário Autenticado (Authenticated User Profile Contract)
 */
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id?: string;
  company?: ICompany | null;
}

/**
 * Interface da Entidade Produto (Product Entity Contract)
 */
export interface IProduct {
  _id: string;
  company_id: string | ICompany;
  name: string;
  description: string;
  price: number;
  isSale?: boolean;
  salePrice?: number;
  attributes?: Record<string, string>;
  category: string;
  imageUrl: string;
  isDigital?: boolean;
  stockQuantity?: number;
  clicksCount?: number;
  searchCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface da Configuração Global de IA da Plataforma (System Global AI Configuration Contract)
 */
export interface ISystemConfig {
  aiProvider: 'openai' | 'deepseek' | 'claude' | 'qwen' | 'openrouter' | 'ollama';
  model: string;
  apiKey?: string;
  baseURL?: string;
  systemPrompt?: string;
  updatedAt?: string;
}

/**
 * Interface de Mensagem de Chat (Conversational Message Model Interface)
 */
export interface IChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  productsRetrieved?: IProduct[];
  meta?: {
    modelUsed: string;
    providerUsed: string;
  };
}

/**
 * Tipos de Eventos do Streaming SSE do Chat (SSE Chat Streaming Event Types)
 */
export type SSEChatEvent =
  | { type: 'ready' }
  | { type: 'tool_started'; tool: string }
  | { type: 'tool_completed'; tool: string; productsRetrieved: IProduct[] }
  | { type: 'text_delta'; delta: string }
  | { type: 'completed'; productsRetrieved: IProduct[]; modelUsed: string; providerUsed: string }
  | { type: 'error'; error: string };
