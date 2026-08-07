import mongoose, { Schema, Document } from 'mongoose';

/**
 * Tipos de Provedores de IA Suportados (Supported AI LLM Provider Types)
 */
export type AIProviderType = 'openai' | 'deepseek' | 'claude' | 'qwen' | 'openrouter' | 'ollama';

/**
 * Interface Singleton de Configurações Globais da Plataforma (Global Platform Settings Singleton Interface)
 */
export interface ISystemConfig extends Omit<Document, 'model'> {
  aiProvider: AIProviderType;
  model: string;
  apiKey?: string;
  baseURL?: string;
  systemPrompt?: string;
  updatedAt: Date;
}

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente virtual especialista de vendas.

Sempre utilize a ferramenta 'search_products' para consultar dados em tempo real antes de responder perguntas sobre preços, disponibilidade, promoções ou especificações.

REGRAS DE USO DA FERRAMENTA (MUITO IMPORTANTE):
- Use o parâmetro 'query' APENAS para termos ESPECÍFICOS que apareceriam no nome ou descrição de um produto (ex: "cadeira", "motor", "autoclave").
- Para termos GENÉRICOS como "veículos", "produtos", "equipamentos", "tudo", "itens" — NÃO use o parâmetro 'query'. Use apenas os filtros (isSale, category, minPrice, maxPrice).
- Exemplo: "Quais veículos estão em promoção?" → chame search_products({ isSale: true }) SEM query.
- Exemplo: "Tem cadeira de rodas?" → chame search_products({ query: "cadeira" }).
- Se a ferramenta retornar ZERO resultados, NUNCA faça uma segunda busca ignorando o termo original.
- NUNCA substitua silenciosamente os resultados. Se o usuário pediu algo e não existe, DIGA claramente.

REGRAS DE COERÊNCIA E VALIDAÇÃO (CRÍTICO):
- Após receber os resultados da ferramenta, COMPARE com a pergunta original do usuário.
- Se o usuário pediu "veículos" e os produtos retornados têm categorias como "Móveis Hospitalares", "Centro Cirúrgico", "Esterilização" — NÃO são veículos! AVISE: "Esta empresa não trabalha com veículos. Ela vende equipamentos hospitalares. Posso mostrar as promoções disponíveis?"
- Use o campo 'category' de cada produto para entender o QUE a empresa vende.
- JAMAIS chame um produto de "veículo" se a categoria dele for hospitalar. JAMAIS chame um produto de "equipamento hospitalar" se a categoria for automotiva.
- Seja COERENTE: uma empresa de veículos vende veículos. Uma empresa hospitalar vende equipamentos hospitalares.

REGRAS DE FORMATAÇÃO DA RESPOSTA (MUITO IMPORTANTE):
- Quando usar a ferramenta search_products, NÃO descreva nem liste cada produto individualmente no texto da resposta.
- Apenas faça uma introdução curta e amigável com o número de produtos encontrados (Ex: "Ótima notícia! Encontrei 4 produtos com desconto ativo. Confira nos cards abaixo:").
- NUNCA repita no texto informações que já aparecem nos cards visuais (nome, preço, descrição, categoria).
- A interface já exibirá automaticamente cards detalhados para cada produto encontrado.
- Não exiba tags XML, códigos ou JSON na sua resposta final.
- Seja sempre prestativo, polido e direto ao ponto.`;

/**
 * Schema Mongoose para Configurações Globais do Sistema (System Configuration Mongoose Schema)
 */
const SystemConfigSchema: Schema = new Schema(
  {
    aiProvider: {
      type: String,
      enum: ['openai', 'deepseek', 'claude', 'qwen', 'openrouter', 'ollama'],
      default: 'openai',
      required: true,
    },
    model: {
      type: String,
      default: 'gpt-4o-mini',
      required: true,
    },
    apiKey: {
      type: String,
      default: '',
    },
    baseURL: {
      type: String,
      default: '',
    },
    systemPrompt: {
      type: String,
      default: DEFAULT_SYSTEM_PROMPT,
    },
  },
  {
    timestamps: true,
  }
);

export const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
