import { SystemConfig } from '../../models/SystemConfig.js';
import { ILLMProvider } from './base.provider.js';
import { OpenAIProvider } from './openai.provider.js';

/**
 * Fábrica de Instanciação do Provedor de IA (LLM Provider Factory Pattern)
 */
export class AIFactory {
  /**
   * Obtém a instância ativa do provedor configurado no sistema (Resolves and returns the active system AI provider instance)
   */
  static async getActiveProvider(): Promise<ILLMProvider> {
    // Busca a configuração global do sistema (Fetch global system configuration singleton)
    let config = await SystemConfig.findOne();

    if (!config) {
      // Se não existir, inicializa com os padrões (Initialize default system config if none exists)
      config = await SystemConfig.create({
        aiProvider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: process.env.OPENAI_BASE_URL || '',
      });
    }

    const { aiProvider, model, apiKey, baseURL } = config;

    // Retorna a implementação do adaptador baseada no provedor (Instantiates provider adapter based on config)
    switch (aiProvider) {
      case 'openai':
      case 'deepseek':
      case 'qwen':
      case 'openrouter':
      case 'ollama':
      case 'claude':
      default:
        return new OpenAIProvider(apiKey, baseURL, model, aiProvider);
    }
  }

  /**
   * Obtém o provedor e a configuração ativa incluindo o System Prompt
   */
  static async getActiveConfigAndProvider() {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({
        aiProvider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: process.env.OPENAI_BASE_URL || '',
      });
    }

    const provider = await this.getActiveProvider();
    return { provider, config };
  }
}
