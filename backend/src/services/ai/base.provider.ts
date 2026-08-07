/**
 * Interface da Mensagem da Conversa (Chat Message Interface Contract)
 */
export interface IChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

/**
 * Resposta Estruturada do Agente de IA (Structured AI Agent Response Contract)
 */
export interface IAIAgentResponse {
  message: string;
  productsRetrieved?: any[];
  modelUsed: string;
  providerUsed: string;
}

/**
 * Tipo de Callback para Eventos de Streaming SSE (SSE Event Callback Type)
 */
export type SSEEventCallback = (event: Record<string, unknown>) => void;

/**
 * Contrato Interface para Provedores de LLM (LLM Provider Interface Contract)
 */
export interface ILLMProvider {
  /**
   * Executa a orquestração da chamada à LLM com Tool Calling (Orchestrates LLM call with Tool Calling loop)
   */
  processChat(messages: IChatMessage[], companyId: string, customSystemPrompt?: string): Promise<IAIAgentResponse>;

  /**
   * Executa o chat com streaming SSE em tempo real (Real-time SSE streaming chat with tool calling).
   * Opcional — provedores que não suportam streaming podem usar apenas processChat como fallback.
   */
  processChatStream?(
    messages: IChatMessage[],
    companyId: string,
    customSystemPrompt?: string,
    onEvent?: SSEEventCallback
  ): Promise<void>;
}
