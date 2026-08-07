import React, { useEffect, useState } from 'react';
import { productApi } from '../api/product.api.js';
import { companyApi } from '../api/company.api.js';
import { useAuthStore } from '../store/authStore.js';
import { IProduct, ICompany } from '../types/index.js';
import { ProductModal } from '../components/products/ProductModal.js';
import { PageHeader } from '../components/common/PageHeader.js';
import {
  BarChart3,
  Package,
  AlertTriangle,
  Search,
  Eye,
  Trophy,
  X,
  ChevronRight,
  ShieldCheck,
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

type SortField = 'name' | 'category' | 'isDigital' | 'price' | 'stockQuantity' | 'clicksCount' | 'searchCount';
type SortOrder = 'asc' | 'desc';

/**
 * Página Dedicada de Inteligência de Estoque & Analytics em Tempo Real
 */
export const AnalyticsPage: React.FC = () => {
  const { user, tenantOverride } = useAuthStore();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado de Ordenação da Tabela de Inventário
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Estado para Edição do Produto e Estoque (State for Full Product & Stock Edit Modal)
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estado para os Modais de Ranking (State for Top 5 Ranking Modals)
  const [rankingModalType, setRankingModalType] = useState<'clicks' | 'searches' | null>(null);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      companyApi
        .getCompanies()
        .then((res) => setCompanies(res.companies))
        .catch((err) => console.error('Erro ao buscar empresas:', err));
    }
  }, [user?.role]);

  const fetchProducts = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError('');
    try {
      const response = await productApi.getProducts({});
      setProducts(response.products);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Erro ao carregar telemetria de produtos.'
      );
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);

    // Atualização em tempo real (Polling a cada 3 segundos)
    const interval = setInterval(() => {
      fetchProducts(false);
    }, 3000);

    const handleFocus = () => fetchProducts(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [tenantOverride]);

  const lowStockProducts = products.filter(
    (p) => !p.isDigital && (p.stockQuantity !== undefined ? p.stockQuantity : 25) < 10
  );

  // Top Ranks
  const topClickedProducts = [...products].sort((a, b) => (b.clicksCount || 0) - (a.clicksCount || 0)).slice(0, 5);
  const topSearchedProducts = [...products].sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0)).slice(0, 5);

  return (
    <div className="space-y-6 font-sans">
      {/* Cabeçalho Padronizado Clean */}
      <PageHeader
        icon={BarChart3}
        title="Performance de Produtos"
        badge={
          <span
            className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block ml-1 shadow-sm shadow-emerald-500/50"
            title="Tempo real ativo"
          />
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Linha Única com Cards Principais (Top 5 Visualizados, Top 5 Pesquisados e Itens em Reposição Crítica) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Top 5 Produtos Mais Visualizados */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 flex-shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top 5 Mais Visualizados</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ranking por índice de cliques.</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[170px]">
              #1: <strong className="text-slate-900 dark:text-white">{topClickedProducts[0]?.name || 'Nenhum'}</strong>
            </div>

            <button
              onClick={() => setRankingModalType('clicks')}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 hover:underline inline-flex items-center gap-1 transition-all"
            >
              Ver ranking <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Top 5 Produtos Mais Pesquisados */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20 flex-shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top 5 Mais Pesquisados</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ranking de pesquisas dos clientes.</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[170px]">
              #1: <strong className="text-slate-900 dark:text-white">{topSearchedProducts[0]?.name || 'Nenhum'}</strong>
            </div>

            <button
              onClick={() => setRankingModalType('searches')}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:underline inline-flex items-center gap-1 transition-all"
            >
              Ver ranking <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Itens em Reposição Crítica */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-rose-500/40 transition-all">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                lowStockProducts.length > 0
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              }`}
            >
              {lowStockProducts.length > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Itens em Reposição Crítica</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Estoque físico abaixo de 10 unidades.</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black ${
                  lowStockProducts.length > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {lowStockProducts.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {lowStockProducts.length === 1 ? 'produto crítico' : 'produtos críticos'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Inventário Simplificada */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Inventário
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th
                  onClick={() => handleSort('name')}
                  className="pb-3 px-3 cursor-pointer select-none group hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  title="Clique para ordenar por Nome"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Produto</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    )}
                  </div>
                </th>

                {/* Coluna Categoria */}
                <th
                  onClick={() => handleSort('category')}
                  className="pb-3 px-3 cursor-pointer select-none group hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  title="Clique para ordenar por Categoria"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Categoria</span>
                    {sortField === 'category' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    )}
                  </div>
                </th>

                {/* Coluna Tipo */}
                <th
                  onClick={() => handleSort('isDigital')}
                  className="pb-3 px-3 text-center cursor-pointer select-none group hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  title="Clique para ordenar por Tipo"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Tipo</span>
                    {sortField === 'isDigital' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    )}
                  </div>
                </th>

                {/* Coluna Preço */}
                <th
                  onClick={() => handleSort('price')}
                  className="pb-3 px-3 text-right cursor-pointer select-none group hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  title="Clique para ordenar por Preço"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Preço</span>
                    {sortField === 'price' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    )}
                  </div>
                </th>

                {/* Coluna Estoque Físico */}
                <th
                  onClick={() => handleSort('stockQuantity')}
                  className="pb-3 px-3 text-right cursor-pointer select-none group hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  title="Clique para ordenar por Estoque"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Estoque Físico</span>
                    {sortField === 'stockQuantity' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    )}
                  </div>
                </th>

                {/* Coluna Visualizações */}
                <th
                  onClick={() => handleSort('clicksCount')}
                  className="pb-3 px-3 text-right cursor-pointer select-none group hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  title="Clique para ordenar por Visualizações"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Visualizações</span>
                    {sortField === 'clicksCount' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    )}
                  </div>
                </th>

                {/* Coluna Buscas */}
                <th
                  onClick={() => handleSort('searchCount')}
                  className="pb-3 px-3 text-right cursor-pointer select-none group hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  title="Clique para ordenar por Buscas"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Buscas</span>
                    {sortField === 'searchCount' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    )}
                  </div>
                </th>

                <th className="pb-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {[...products]
                .sort((a, b) => {
                  let valA: any = a[sortField];
                  let valB: any = b[sortField];

                  if (sortField === 'name') {
                    valA = (a.name || '').toLowerCase();
                    valB = (b.name || '').toLowerCase();
                  } else if (sortField === 'category') {
                    valA = (a.category || '').toLowerCase();
                    valB = (b.category || '').toLowerCase();
                  } else if (sortField === 'isDigital') {
                    valA = a.isDigital ? 1 : 0;
                    valB = b.isDigital ? 1 : 0;
                  } else if (sortField === 'stockQuantity') {
                    valA = a.isDigital ? 999999 : a.stockQuantity !== undefined ? a.stockQuantity : 25;
                    valB = b.isDigital ? 999999 : b.stockQuantity !== undefined ? b.stockQuantity : 25;
                  } else {
                    valA = valA || 0;
                    valB = valB || 0;
                  }

                  if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                  if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                  return 0;
                })
                .map((product) => {
                  const isLowStock =
                    !product.isDigital && (product.stockQuantity !== undefined ? product.stockQuantity : 25) < 10;
                  const stock = product.isDigital
                    ? '∞ (Digital)'
                    : `${product.stockQuantity !== undefined ? product.stockQuantity : 25} un.`;

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800 flex-shrink-0"
                            />
                          )}
                          <span className="truncate max-w-[200px]">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">{product.category}</td>
                      <td className="py-3 px-3 text-center">
                        {product.isDigital ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                            Digital
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                            Físico
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-extrabold px-2 py-0.5 rounded-lg ${
                            product.isDigital
                              ? 'text-purple-600 dark:text-purple-300 bg-purple-500/10'
                              : isLowStock
                                ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20'
                                : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                          {stock}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        {product.clicksCount || 0}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        {product.searchCount || 0}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-all inline-flex items-center justify-center"
                          title="Editar Produto e Estoque"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal do Ranking Top 5 (Exibe quando o usuário clica nos cards de ranking) */}
      {rankingModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    rankingModalType === 'clicks'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {rankingModalType === 'clicks'
                      ? 'Top 5 Produtos Mais Visualizados'
                      : 'Top 5 Produtos Mais Pesquisados'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {rankingModalType === 'clicks'
                      ? 'Ranking baseado no número de cliques no catálogo.'
                      : 'Ranking baseado no número de buscas feitas por clientes.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRankingModalType(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista dos 5 Melhores */}
            <div className="space-y-3">
              {(rankingModalType === 'clicks' ? topClickedProducts : topSearchedProducts).map((product, idx) => {
                const count = rankingModalType === 'clicks' ? product.clicksCount || 0 : product.searchCount || 0;
                const maxCount =
                  rankingModalType === 'clicks'
                    ? topClickedProducts[0]?.clicksCount || 1
                    : topSearchedProducts[0]?.searchCount || 1;
                const percentage = Math.round((count / (maxCount || 1)) * 100);

                return (
                  <div
                    key={product._id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#06080d] border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span
                          className={`w-7 h-7 rounded-xl font-black flex items-center justify-center text-xs flex-shrink-0 ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                              : idx === 1
                                ? 'bg-slate-300/20 text-slate-300 border border-slate-400/30'
                                : idx === 2
                                  ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                                  : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</span>
                      </div>

                      <span className="font-extrabold text-slate-900 dark:text-white flex-shrink-0 ml-2">
                        {count}{' '}
                        {rankingModalType === 'clicks'
                          ? count === 1
                            ? 'clique'
                            : 'cliques'
                          : count === 1
                            ? 'busca'
                            : 'buscas'}
                      </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          rankingModalType === 'clicks'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-500'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                        }`}
                        style={{ width: `${Math.max(percentage, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setRankingModalType(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Produto e Estoque (Analytics Exclusive) */}
      {isEditModalOpen && (
        <ProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={async (productData) => {
            if (editingProduct) {
              await productApi.updateProduct(editingProduct._id, productData);
              fetchProducts(false);
            }
          }}
          productToEdit={editingProduct}
          companies={companies}
          isSuperAdmin={user?.role === 'superadmin'}
          showStockFields={true}
        />
      )}
    </div>
  );
};
