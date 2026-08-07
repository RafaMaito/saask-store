import React from 'react';
import { IProduct } from '../../types/index.js';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import {
  X,
  Tag,
  Flame,
  Bot,
  Info,
  CheckCircle2,
  Building2,
  Sparkles,
  ShieldCheck,
  Package,
  Eye,
  Search,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: IProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de Detalhes do Produto em Destaque (Featured Product Detail Modal)
 */
export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  if (!isOpen || !product) return null;

  const hasSale = product.isSale && product.salePrice && product.salePrice > 0;
  const discountPercent = hasSale
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;
  const savings = hasSale ? product.price - product.salePrice! : 0;

  const handleAskAI = () => {
    onClose();
    navigate('/chat', { state: { focusedProduct: product } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl transition-all relative flex flex-col max-h-[90vh]">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Detalhes do Produto em Destaque</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Imagem Principal do Produto */}
          <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
              }}
            />

            {/* Badges Flutuantes */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <span className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md text-xs font-semibold px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 flex items-center gap-1.5 shadow-md">
                <Tag className="w-3.5 h-3.5" /> {product.category}
              </span>

              {typeof product.company_id === 'object' && (
                <span className="bg-purple-500/90 backdrop-blur-md text-xs font-semibold px-3 py-1 rounded-xl text-white flex items-center gap-1 shadow-md">
                  <Building2 className="w-3.5 h-3.5" /> {product.company_id.name}
                </span>
              )}
            </div>

            {hasSale && (
              <span className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 animate-pulse">
                <Flame className="w-4 h-4" /> SALE -{discountPercent}% (Economia de R$ {savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
              </span>
            )}
          </div>

          {/* Título & Descrição */}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{product.name}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{product.description}</p>
          </div>

          {/* Valores de Preço */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider block">
                {hasSale ? 'Preço Promocional (Sale)' : 'Preço Normal'}
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  R$ {(hasSale ? product.salePrice! : product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {hasSale && (
                  <span className="text-sm text-slate-400 line-through">
                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>

            {hasSale && (
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                Economize {discountPercent}% nesta compra
              </span>
            )}
          </div>

          {/* Especificações Técnicas Completas */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Ficha Técnica & Especificações do Produto
            </h3>

            {product.attributes && Object.keys(product.attributes).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(product.attributes).map(([chave, valor]) => (
                  <div
                    key={chave}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{chave}:</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{valor}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-500 text-xs italic text-center">
                Nenhuma especificação customizada cadastrada para este produto.
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>

          <button
            onClick={handleAskAI}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Bot className="w-4 h-4" /> Perguntar ao Agente IA sobre este produto
          </button>
        </div>
      </div>
    </div>
  );
};
