import OpenAI from 'openai';
import { ILLMProvider, IChatMessage, IAIAgentResponse } from './base.provider.js';
import { ProductService } from '../product.service.js';

/**
 * Adaptador Provedor OpenAI e Compatíveis (OpenAI Compatible Provider Adapter Implementation)
 * Suporta OpenAI, DeepSeek, Qwen, OpenRouter, Groq e Ollama.
 */
export class OpenAIProvider implements ILLMProvider {
  private client: OpenAI;
  private model: string;
  private providerName: string;

  constructor(apiKey?: string, baseURL?: string, model: string = 'gpt-4o-mini', providerName: string = 'openai') {
    this.model = model;
    this.providerName = providerName;

    // Configura o endpoint base apropriado para o provedor (Resolves base URL according to provider)
    let resolvedBaseURL = baseURL && baseURL.trim() !== '' ? baseURL : undefined;

    if (!resolvedBaseURL) {
      if (providerName === 'deepseek') resolvedBaseURL = 'https://api.deepseek.com/v1';
      else if (providerName === 'openrouter') resolvedBaseURL = 'https://openrouter.ai/api/v1';
      else if (providerName === 'ollama') resolvedBaseURL = 'http://localhost:11434/v1';
      else if (providerName === 'qwen') resolvedBaseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    }

    const resolvedApiKey = apiKey && apiKey.trim() !== '' ? apiKey : process.env.OPENAI_API_KEY || 'mock-key';

    this.client = new OpenAI({
      apiKey: resolvedApiKey,
      baseURL: resolvedBaseURL,
    });
  }

  async processChat(
    messages: IChatMessage[],
    companyId: string,
    customSystemPrompt?: string
  ): Promise<IAIAgentResponse> {
    // Especificação da Ferramenta de Busca de Produtos (Tool Specification Schema)
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'search_products',
          description:
            'Busca os produtos cadastrados no estoque da empresa por nome, descrição, categoria ou faixa de preço.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Palavra-chave para buscar no nome ou descrição do produto.',
              },
              category: {
                type: 'string',
                description: 'Categoria do produto (ex: Eletrônicos, Roupas, Periféricos).',
              },
              minPrice: {
                type: 'number',
                description: 'Preço mínimo em reais (BRL).',
              },
              maxPrice: {
                type: 'number',
                description: 'Preço máximo em reais (BRL).',
              },
              isSale: {
                type: 'boolean',
                description: 'Filtrar apenas produtos que estão em promoção, liquidação ou sale (isSale = true).',
              },
            },
          },
        },
      },
    ];

    // System Prompt Contextual (Contextualized System Prompt)
    const activeSystemPrompt =
      customSystemPrompt ||
      `Você é um assistente virtual especialista de vendas.

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

    const systemPromptMsg: IChatMessage = {
      role: 'system',
      content: activeSystemPrompt,
    };

    const formattedMessages = [systemPromptMsg, ...messages];
    let productsRetrieved: any[] = [];

    try {
      // Primeira Chamada à LLM (First LLM Completion Turn)
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: formattedMessages as any,
        tools,
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0].message;

      // Verificação de Solicitação de Chamada de Ferramenta (Tool Call Execution Check)
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Adiciona a resposta do assistente com o chamado da ferramenta ao histórico
        formattedMessages.push(responseMessage as any);

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === 'search_products') {
            let args: any = {};
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch (e) {
              args = {};
            }

            // Execução Segura da Ferramenta com Escopo Multitenant (Secure Multitenant Scoped Tool Execution)
            const products = await ProductService.searchProductsByTenant(companyId, args);

            // Filtro de relevância: se o termo do usuário não aparece em nenhum produto, não mostrar cards
            const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
            const userWords = lastUserMsg
              .toLowerCase()
              .replace(/[?,.;:!]/g, '')
              .split(/\s+/)
              .filter(
                (w) =>
                  w.length > 3 &&
                  ![
                    'quais',
                    'estão',
                    'vocês',
                    'para',
                    'como',
                    'sobre',
                    'qual',
                    'tem',
                    'uma',
                    'que',
                    'com',
                    'dos',
                    'das',
                    'isso',
                    'esse',
                    'essa',
                    'disponível',
                    'estoque',
                    'promoção',
                    'desconto',
                    'ativo',
                    'sale',
                  ].includes(w)
              );
            if (products.length > 0 && userWords.length > 0) {
              const hasRelevantMatch = products.some((p) =>
                userWords.some(
                  (w) =>
                    p.name.toLowerCase().includes(w) ||
                    p.description.toLowerCase().includes(w) ||
                    p.category.toLowerCase().includes(w)
                )
              );
              productsRetrieved = hasRelevantMatch ? products : [];
            } else {
              productsRetrieved = products;
            }

            // Retorna o resultado para a LLM (Feed tool response back to LLM)
            formattedMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(products),
            } as any);
          }
        }

        // Segunda Chamada à LLM com o Resultado da Ferramenta (Second Turn: Final Synthesis)
        const secondResponse = await this.client.chat.completions.create({
          model: this.model,
          messages: formattedMessages as any,
        });

        return {
          message: secondResponse.choices[0].message.content || 'Nenhuma resposta gerada.',
          productsRetrieved,
          modelUsed: this.model,
          providerUsed: this.providerName,
        };
      }

      // Se a LLM respondeu diretamente sem acionar a ferramenta
      return {
        message: responseMessage.content || 'Nenhuma resposta gerada.',
        productsRetrieved,
        modelUsed: this.model,
        providerUsed: this.providerName,
      };
    } catch (error: any) {
      console.warn(
        `[AI Provider Warning] Falha ao comunicar com provedor ${this.providerName} (${error.message}). Executando fallback determinístico local.`
      );

      // Fallback Determinístico Local para Teste sem Chave Válida (Local Deterministic Fallback Mode)
      const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
      const isSaleSearch = /promoc|promo|sale|oferta|desconto|liquida/i.test(lastUserMsg);

      const products = await ProductService.searchProductsByTenant(companyId, {
        query: lastUserMsg,
        isSale: isSaleSearch ? true : undefined,
      });

      let fallbackText = `[Modo Demonstrativo - ${this.providerName} (${this.model})]\n\n`;
      if (products.length > 0) {
        const saleCount = products.filter((p) => p.isSale).length;
        fallbackText +=
          saleCount > 0
            ? `Encontrei ${products.length} produto(s), sendo ${saleCount} em promoção! Confira os detalhes nos cards abaixo:`
            : `Encontrei ${products.length} produto(s) no catálogo. Confira os detalhes nos cards abaixo:`;
      } else {
        fallbackText += `Consultei o catálogo e não encontrei produtos para "${lastUserMsg}". Tente refinar sua busca ou usar outro termo.`;
      }

      return {
        message: fallbackText,
        productsRetrieved: products,
        modelUsed: `${this.model} (Fallback Mode)`,
        providerUsed: this.providerName,
      };
    }
  }

  async processChatStream(
    messages: IChatMessage[],
    companyId: string,
    customSystemPrompt?: string,
    onEvent?: (event: any) => void
  ): Promise<void> {
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'search_products',
          description:
            'Busca os produtos cadastrados no estoque da empresa por nome, descrição, categoria ou faixa de preço.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Palavra-chave para buscar no nome ou descrição.' },
              category: { type: 'string', description: 'Categoria do produto.' },
              minPrice: { type: 'number', description: 'Preço mínimo em reais (BRL).' },
              maxPrice: { type: 'number', description: 'Preço máximo em reais (BRL).' },
              isSale: { type: 'boolean', description: 'Filtrar produtos que estão em promoção/sale.' },
            },
          },
        },
      },
    ];

    const activeSystemPrompt =
      customSystemPrompt ||
      `Você é um assistente virtual especialista de vendas.

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

    const systemPromptMsg: IChatMessage = { role: 'system', content: activeSystemPrompt };
    const formattedMessages = [systemPromptMsg, ...messages];
    let productsRetrieved: any[] = [];

    try {
      if (onEvent) onEvent({ type: 'ready' });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: formattedMessages as any,
        tools,
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0].message;

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        formattedMessages.push(responseMessage as any);

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === 'search_products') {
            if (onEvent) onEvent({ type: 'tool_started', tool: 'search_products' });

            let args: any = {};
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch (e) {
              args = {};
            }

            const products = await ProductService.searchProductsByTenant(companyId, args);

            // Filtro de relevância: se o termo do usuário não aparece em nenhum produto, não mostrar cards
            const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
            const userWords = lastUserMsg
              .toLowerCase()
              .replace(/[?,.;:!]/g, '')
              .split(/\s+/)
              .filter(
                (w) =>
                  w.length > 3 &&
                  ![
                    'quais',
                    'estão',
                    'vocês',
                    'para',
                    'como',
                    'sobre',
                    'qual',
                    'tem',
                    'uma',
                    'que',
                    'com',
                    'dos',
                    'das',
                    'isso',
                    'esse',
                    'essa',
                    'disponível',
                    'estoque',
                    'promoção',
                    'desconto',
                    'ativo',
                    'sale',
                  ].includes(w)
              );
            const relevantProducts =
              products.length > 0 && userWords.length > 0
                ? products.some((p) =>
                    userWords.some(
                      (w) =>
                        p.name.toLowerCase().includes(w) ||
                        p.description.toLowerCase().includes(w) ||
                        p.category.toLowerCase().includes(w)
                    )
                  )
                  ? products
                  : []
                : products;
            productsRetrieved = relevantProducts;

            if (onEvent)
              onEvent({ type: 'tool_completed', tool: 'search_products', productsRetrieved: relevantProducts });

            formattedMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(products),
            } as any);
          }
        }

        const stream = await this.client.chat.completions.create({
          model: this.model,
          messages: formattedMessages as any,
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta && onEvent) {
            onEvent({ type: 'text_delta', delta });
          }
        }

        if (onEvent) {
          onEvent({
            type: 'completed',
            productsRetrieved,
            modelUsed: this.model,
            providerUsed: this.providerName,
          });
        }
        return;
      }

      const directContent = responseMessage.content || 'Nenhuma resposta gerada.';
      if (onEvent) {
        onEvent({ type: 'text_delta', delta: directContent });
        onEvent({
          type: 'completed',
          productsRetrieved: [],
          modelUsed: this.model,
          providerUsed: this.providerName,
        });
      }
    } catch (error: any) {
      console.warn(`[AI Streaming Warning] Fallback acionado (${error.message}).`);

      const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
      const isSaleSearch = /promoc|promo|sale|oferta|desconto|liquida/i.test(lastUserMsg);

      const products = await ProductService.searchProductsByTenant(companyId, {
        query: lastUserMsg,
        isSale: isSaleSearch ? true : undefined,
      });

      let fallbackText = `[Modo Demonstrativo - ${this.providerName} (${this.model})]\n\n`;
      if (products.length > 0) {
        const saleCount = products.filter((p) => p.isSale).length;
        fallbackText +=
          saleCount > 0
            ? `Encontrei ${products.length} produto(s), sendo ${saleCount} em promoção! Confira os detalhes nos cards abaixo:`
            : `Encontrei ${products.length} produto(s) no catálogo. Confira os detalhes nos cards abaixo:`;
      } else {
        fallbackText += `Consultei o catálogo e não encontrei produtos para "${lastUserMsg}". Tente refinar sua busca ou usar outro termo.`;
      }

      if (onEvent) {
        if (products.length > 0) {
          onEvent({ type: 'tool_started', tool: 'search_products' });
          onEvent({ type: 'tool_completed', tool: 'search_products', productsRetrieved: products });
        }
        onEvent({ type: 'text_delta', delta: fallbackText });
        onEvent({
          type: 'completed',
          productsRetrieved: products,
          modelUsed: `${this.model} (Fallback Mode)`,
          providerUsed: this.providerName,
        });
      }
    }
  }
}
