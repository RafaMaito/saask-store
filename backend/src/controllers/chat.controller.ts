import { Request, Response } from 'express';
import { AIFactory } from '../services/ai/ai.factory.js';
import { IChatMessage } from '../services/ai/base.provider.js';

/**
 * Controlador do Agente Conversacional com Orquestração de IA (AI Conversational Agent Controller)
 */
export class ChatController {
  /**
   * Endpoint de Envio de Mensagem para a IA (Send Chat Message & Execute AI Tool Calling)
   */
  static async handleChat(req: Request, res: Response) {
    try {
      const { message, history } = req.body;
      const companyId = req.companyId;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'A mensagem do usuário é obrigatória (User chat message is required)' });
      }

      if (!companyId && req.user?.role !== 'superadmin') {
        return res.status(400).json({ error: 'Empresa não identificada no contexto (Tenant company scope missing)' });
      }

      // Superadmin precisa ter uma empresa selecionada para usar o chat (Superadmin must select a tenant company)
      if (!companyId && req.user?.role === 'superadmin') {
        return res.status(400).json({
          error: 'Selecione uma empresa no menu lateral antes de usar o chat (Select a company in the sidebar first)',
        });
      }

      // Constrói o histórico de mensagens formatado (Build formatted message history array)
      const messageHistory: IChatMessage[] = [];

      if (Array.isArray(history)) {
        history.forEach((msg: any) => {
          if (msg.role && msg.content) {
            messageHistory.push({
              role: msg.role,
              content: msg.content,
            });
          }
        });
      }

      // Adiciona a mensagem atual do usuário (Append current user message)
      messageHistory.push({
        role: 'user',
        content: message,
      });

      // Obtém a instância ativa do provedor de IA e a configuração com o System Prompt
      const { provider: aiProvider, config } = await AIFactory.getActiveConfigAndProvider();

      // Executa o processamento do chat com isolamento de tenant (Process chat with tenant data isolation)
      const targetTenantId = companyId || req.user?.company_id?.toString() || '';
      const response = await aiProvider.processChat(messageHistory, targetTenantId, config.systemPrompt);

      return res.status(200).json({
        reply: response.message,
        productsRetrieved: response.productsRetrieved || [],
        meta: {
          modelUsed: response.modelUsed,
          providerUsed: response.providerUsed,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('[Chat Processing Error] Exceção no processamento do chat:', error);
      return res.status(500).json({
        error: error.message || 'Falha ao processar mensagem do agente de IA (Failed to process AI chat message)',
      });
    }
  }

  /**
   * Endpoint de Transmissão de Mensagem para a IA via SSE (Stream Chat Response via Server-Sent Events)
   */
  static async handleChatStream(req: Request, res: Response) {
    const { message, history } = req.body;
    const companyId = req.companyId;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'A mensagem do usuário é obrigatória' });
    }

    if (!companyId && req.user?.role !== 'superadmin') {
      return res.status(400).json({ error: 'Empresa não identificada no contexto' });
    }

    // Superadmin precisa ter uma empresa selecionada para usar o chat com streaming
    if (!companyId && req.user?.role === 'superadmin') {
      return res.status(400).json({
        error: 'Selecione uma empresa no menu lateral antes de usar o chat (Select a company in the sidebar first)',
      });
    }

    // Configura os cabeçalhos HTTP para protocolo SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Desabilita buffering no Nginx

    const messageHistory: IChatMessage[] = [];
    if (Array.isArray(history)) {
      history.forEach((msg: any) => {
        if (msg.role && msg.content) {
          messageHistory.push({ role: msg.role, content: msg.content });
        }
      });
    }
    messageHistory.push({ role: 'user', content: message });

    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const { provider: aiProvider, config } = await AIFactory.getActiveConfigAndProvider();
      const targetTenantId = companyId || req.user?.company_id?.toString() || '';

      if (typeof aiProvider.processChatStream === 'function') {
        await aiProvider.processChatStream(messageHistory, targetTenantId, config.systemPrompt, sendEvent);
      } else {
        const response = await aiProvider.processChat(messageHistory, targetTenantId, config.systemPrompt);
        if (response.productsRetrieved && response.productsRetrieved.length > 0) {
          sendEvent({ type: 'tool_completed', tool: 'search_products', productsRetrieved: response.productsRetrieved });
        }
        sendEvent({ type: 'text_delta', delta: response.message });
        sendEvent({
          type: 'completed',
          productsRetrieved: response.productsRetrieved || [],
          modelUsed: response.modelUsed,
          providerUsed: response.providerUsed,
        });
      }
    } catch (error: any) {
      sendEvent({ type: 'error', error: error.message || 'Erro ao processar streaming' });
    } finally {
      res.end();
    }
  }
}
