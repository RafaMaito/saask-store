import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader.js';
import { chatApi } from '../api/chat.api.js';
import { companyApi } from '../api/company.api.js';
import { useAuthStore } from '../store/authStore.js';
import { IChatMessage, IProduct } from '../types/index.js';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Tag,
  Cpu,
  PackageCheck,
  RefreshCw,
  Search,
  Package,
  X,
} from 'lucide-react';

/**
 * Interface do Agente Conversacional com Orquestração de IA e Streaming SSE (Server-Sent Events)
 */
export const ChatPage: React.FC = () => {
  const location = useLocation();
  const initialFocusedProduct = location.state?.focusedProduct as IProduct | undefined;
  const [focusedProduct, setFocusedProduct] = useState<IProduct | undefined>(initialFocusedProduct);
  const { user, tenantOverride } = useAuthStore();

  const [companyName, setCompanyName] = useState<string>(user?.company?.name || 'nossa empresa');

  useEffect(() => {
    if (user?.role === 'superadmin' && tenantOverride) {
      companyApi
        .getCompanies()
        .then((res) => {
          const found = res.companies.find((c) => c._id === tenantOverride);
          if (found) setCompanyName(found.name);
        })
        .catch((err) => console.error('Erro ao buscar nome da empresa:', err));
    } else if (user?.company?.name) {
      setCompanyName(user.company.name);
    }
  }, [user, tenantOverride]);

  const [messages, setMessages] = useState<IChatMessage[]>([]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const welcomeContent = focusedProduct
      ? `Olá! Estou pronto para tirar qualquer dúvida sobre o produto **${focusedProduct.name}**.\n\nO que você gostaria de saber sobre o produto em questão? (Ex: ficha técnica, garantia, preço ou disponibilidade)`
      : `Olá! Sou o assistente de IA da ${companyName}. Posso consultar nosso banco de dados em tempo real para te ajudar a encontrar produtos, verificar preços e tirar dúvidas. Como posso ajudar hoje?`;

    // Sempre reseta as mensagens ao trocar de empresa (Reset chat when switching tenant company)
    setMessages([
      {
        id: focusedProduct ? 'welcome-focused' : `welcome-${Date.now()}`,
        sender: 'assistant',
        content: welcomeContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [focusedProduct?._id, companyName, tenantOverride]);

  const handleClearChat = () => {
    setFocusedProduct(undefined);
    window.history.replaceState({}, document.title);

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        content: `Olá! Sou o assistente de IA da ${companyName}. Posso consultar nosso banco de dados em tempo real para te ajudar a encontrar produtos, verificar preços e tirar dúvidas. Como posso ajudar hoje?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, streamStatus]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: IChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customMessage) setInputMessage('');
    setLoading(true);
    setStreamStatus('Iniciando comunicação com agente de IA...');

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsgPlaceholder: IChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      productsRetrieved: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, assistantMsgPlaceholder]);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      await chatApi.sendMessageStream(textToSend, historyPayload, (event) => {
        if (event.type === 'ready') {
          setStreamStatus('Agente pronto. Processando prompt...');
        } else if (event.type === 'tool_started') {
          setStreamStatus(`🔍 Consultando banco de dados da empresa (${event.tool})...`);
        } else if (event.type === 'tool_completed') {
          setStreamStatus(null);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, productsRetrieved: event.productsRetrieved || [] } : msg
            )
          );
        } else if (event.type === 'text_delta') {
          setStreamStatus(null);
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, content: msg.content + event.delta } : msg))
          );
        } else if (event.type === 'completed') {
          setStreamStatus(null);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    productsRetrieved: event.productsRetrieved || msg.productsRetrieved || [],
                    meta: {
                      modelUsed: event.modelUsed,
                      providerUsed: event.providerUsed,
                      timestamp: new Date().toISOString(),
                    },
                  }
                : msg
            )
          );
        } else if (event.type === 'error') {
          setStreamStatus(null);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: `Erro no streaming: ${event.error}` } : msg
            )
          );
        }
      });
    } catch (err: unknown) {
      setStreamStatus(null);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: `Falha na conexão: ${(err as Error).message || 'Erro desconhecido'}` }
            : msg
        )
      );
    } finally {
      setLoading(false);
      setStreamStatus(null);
    }
  };

  const suggestedPrompts = focusedProduct
    ? [
        `Quais as especificações técnicas de ${focusedProduct.name}?`,
        `Qual o preço e condições de garantia do ${focusedProduct.name}?`,
        `Este produto tem desconto ou oferta ativa?`,
      ]
    : [
        'Quais veículos estão em promoção?',
        'Quais equipamentos hospitalares vocês têm em estoque?',
        'Quais produtos têm desconto ativo (sale)?',
      ];

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col justify-between max-w-5xl mx-auto space-y-4 font-sans">
      {/* Cabeçalho Padronizado do Chat */}
      <PageHeader
        icon={Bot}
        title="Agente IA"
        subtitle={
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              Assistente virtual para te auxiliar com qualquer dúvida ou informação sobre os produtos disponíveis.
            </span>
          </div>
        }
        actions={
          <button
            onClick={handleClearChat}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-purple-500/50 shadow-sm transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Limpar Conversa e Remover Produto em Foco"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Limpar Chat
          </button>
        }
      />

      {/* Banner de Destaque para Produto em Foco */}
      {focusedProduct && (
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-3 text-sm text-purple-700 dark:text-purple-300 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={focusedProduct.imageUrl}
              alt={focusedProduct.name}
              className="w-10 h-10 rounded-xl object-cover bg-slate-900 flex-shrink-0 border border-purple-500/30"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
              }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Produto em Foco na Consulta
                </span>
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{focusedProduct.name}</h4>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              R${' '}
              {(focusedProduct.isSale && focusedProduct.salePrice
                ? focusedProduct.salePrice
                : focusedProduct.price
              ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <button
              onClick={() => setFocusedProduct(undefined)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="Remover Foco do Produto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Card Delimitador do Container de Chat */}
      <div className="flex-1 bg-white/90 dark:bg-[#0c101b]/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 flex flex-col justify-between space-y-4 backdrop-blur-md shadow-md overflow-hidden">
        {/* Janela Principal de Mensagens */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-md ${
                  msg.sender === 'user' ? 'bg-purple-600' : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                }`}
              >
                {msg.sender === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Balão de Mensagem */}
              <div className="space-y-2 max-w-full">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-600/20'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.content === '' && loading ? (
                    <span className="italic text-slate-400 dark:text-slate-500 animate-pulse">
                      Digitando resposta...
                    </span>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Metadata Pill */}
                  {msg.meta && (
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <Cpu className="w-3 h-3 text-purple-500" />
                      <span>
                        Provedor:{' '}
                        <strong className="text-purple-600 dark:text-purple-300 uppercase">
                          {msg.meta.providerUsed}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Modelo: <strong className="text-slate-700 dark:text-slate-200">{msg.meta.modelUsed}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Cartões de Produtos Retornados via Tool Calling */}
                {msg.productsRetrieved && msg.productsRetrieved.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-500" /> Produtos Consultados no Banco (Tool
                      Result):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                      {msg.productsRetrieved.map((product: IProduct) => (
                        <div
                          key={product._id}
                          className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex gap-3 items-center hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded-lg bg-slate-100 dark:bg-slate-900 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                              {product.name}
                              {product.isSale && (
                                <span className="text-[9px] bg-red-500/10 text-red-500 font-extrabold px-1 rounded">
                                  🔥 SALE
                                </span>
                              )}
                            </h4>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                              {product.category}
                            </span>
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                              R${' '}
                              {(product.isSale && product.salePrice ? product.salePrice : product.price).toLocaleString(
                                'pt-BR',
                                { minimumFractionDigits: 2 }
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 dark:text-slate-500 block px-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {/* Indicador de Status SSE em Tempo Real */}
          {streamStatus && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 shadow-sm">
                <Search className="w-4 h-4 text-purple-500 animate-spin" />
                <span>{streamStatus}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompts Sugeridos */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 border-t border-slate-200 dark:border-slate-800/80">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="text-xs font-medium bg-slate-100 dark:bg-slate-900 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-300 hover:border-purple-500/30 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Tag className="w-3 h-3 text-purple-500" /> {prompt}
            </button>
          ))}
        </div>

        {/* Campo de Digitação */}
        <div className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 p-2 rounded-2xl shadow-md focus-within:border-purple-500 transition-all"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                focusedProduct
                  ? `Pergunte o que você gostaria de saber sobre ${focusedProduct.name}...`
                  : 'Pergunte sobre veículos, equipamentos hospitalares, preços ou promoções...'
              }
              className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md shadow-purple-600/30 disabled:opacity-40 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
