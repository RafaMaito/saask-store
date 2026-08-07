import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader.js';
import { systemApi } from '../api/system.api.js';
import { ISystemConfig } from '../types/index.js';
import { Settings, Cpu, Key, Globe, Check, RefreshCw, Sparkles, Terminal, RotateCcw } from 'lucide-react';

const DEFAULT_PROMPT = `Você é um assistente virtual especialista de vendas.

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
 * Painel de Configurações Globais de IA do Sistema (Global Platform AI Provider & System Prompt Settings)
 */
export const SettingsPage: React.FC = () => {
  const [provider, setProvider] = useState<string>('openai');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseURL, setBaseURL] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await systemApi.getConfig();
      if (res.config) {
        setProvider(res.config.aiProvider || 'openai');
        setModel(res.config.model || 'gpt-4o-mini');
        setApiKey(res.config.apiKey || '');
        setBaseURL(res.config.baseURL || '');
        setSystemPrompt(res.config.systemPrompt || DEFAULT_PROMPT);
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Erro ao carregar configurações de IA.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await systemApi.updateConfig({
        aiProvider: provider as any,
        model,
        apiKey,
        baseURL,
        systemPrompt,
      });
      setMessage('Configuração de IA e System Prompt salvos com sucesso!');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Erro ao salvar configuração de IA.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Predefinições Rápidas de Provedores (Quick Provider Preset Selectors)
  const applyPreset = (p: string, defaultModel: string, defaultURL: string) => {
    setProvider(p);
    setModel(defaultModel);
    if (defaultURL) setBaseURL(defaultURL);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Cabeçalho Padronizado */}
      <PageHeader
        icon={Settings}
        title="Configurações Globais de IA"
        subtitle="Configure o Provedor de IA, Chaves de API e personalize o System Prompt do Agente Conversacional."
        actions={
          <button
            onClick={fetchConfig}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors"
            title="Atualizar Configurações"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <Check className="w-5 h-5" /> {message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Seleção de Presets Rápidos de Provedor (Provider Preset Cards) */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" /> Provedores Suportados (Supported AI LLM Providers)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('openai', 'gpt-4o-mini', 'https://api.openai.com/v1')}
            className={`p-3 rounded-xl border text-center transition-all text-xs font-semibold ${
              provider === 'openai'
                ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            🤖 OpenAI
          </button>
          <button
            type="button"
            onClick={() => applyPreset('deepseek', 'deepseek-chat', 'https://api.deepseek.com/v1')}
            className={`p-3 rounded-xl border text-center transition-all text-xs font-semibold ${
              provider === 'deepseek'
                ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            🐋 DeepSeek
          </button>
          <button
            type="button"
            onClick={() => applyPreset('claude', 'claude-3-5-sonnet-20240620', '')}
            className={`p-3 rounded-xl border text-center transition-all text-xs font-semibold ${
              provider === 'claude'
                ? 'bg-purple-50 dark:bg-purple-600/20 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            🎭 Claude
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset('qwen', 'qwen-2.5-72b-instruct', 'https://dashscope.aliyuncs.com/compatible-mode/v1')
            }
            className={`p-3 rounded-xl border text-center transition-all text-xs font-semibold ${
              provider === 'qwen'
                ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            🔮 Qwen
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset('openrouter', 'meta-llama/llama-3.1-70b-instruct', 'https://openrouter.ai/api/v1')
            }
            className={`p-3 rounded-xl border text-center transition-all text-xs font-semibold ${
              provider === 'openrouter'
                ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            🌐 OpenRouter
          </button>
          <button
            type="button"
            onClick={() => applyPreset('ollama', 'llama3:8b', 'http://localhost:11434/v1')}
            className={`p-3 rounded-xl border text-center transition-all text-xs font-semibold ${
              provider === 'ollama'
                ? 'bg-amber-50 dark:bg-amber-600/20 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            🦙 Ollama
          </button>
        </div>
      </div>

      {/* Form de Edição de Configurações (Settings Form Controls) */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500" /> Provedor Ativo (Active AI Provider) *
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                required
              >
                <option value="openai">OpenAI</option>
                <option value="deepseek">DeepSeek AI</option>
                <option value="claude">Anthropic Claude</option>
                <option value="qwen">Alibaba Qwen</option>
                <option value="openrouter">OpenRouter AI API</option>
                <option value="ollama">Ollama Local (Offline)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nome do Modelo (Model Identifier) *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: gpt-4o-mini ou deepseek-chat"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-500" /> Chave de API (API Key)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono text-xs"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Se deixado em branco, o sistema usará as variáveis de ambiente ativas no servidor (OPENAI_API_KEY).
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" /> Base URL Customizada (Custom API Endpoint)
            </label>
            <input
              type="url"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder="https://api.openai.com/v1 ou http://localhost:11434/v1"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-mono text-xs"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Opcional para OpenAI. Obrigatório para endpoints customizados como Ollama local ou OpenRouter.
            </span>
          </div>

          {/* Edição do System Prompt da IA (Custom System Prompt Control) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-500" /> System Prompt do Agente de IA (AI System Persona)
              </label>
              <button
                type="button"
                onClick={() => setSystemPrompt(DEFAULT_PROMPT)}
                className="text-xs text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 transition-colors"
                title="Restaurar prompt padrão"
              >
                <RotateCcw className="w-3 h-3" /> Restaurar Padrão
              </button>
            </div>
            <textarea
              rows={5}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Instruções de sistema para a LLM..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors leading-relaxed"
            />
            <span className="text-[11px] text-slate-500 block">
              O System Prompt define o comportamento, diretrizes e tom de voz da IA. Certifique-se de orientar o modelo
              a utilizar a tool <code className="text-purple-500 font-bold">search_products</code>.
            </span>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações de IA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
