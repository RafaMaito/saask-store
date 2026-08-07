import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { productApi, ICreateProductPayload } from '../api/product.api.js';
import { companyApi } from '../api/company.api.js';
import { IProduct, ICompany } from '../types/index.js';
import { ProductModal } from '../components/products/ProductModal.js';
import { ProductDetailModal } from '../components/products/ProductDetailModal.js';
import { PageHeader } from '../components/common/PageHeader.js';
import {
  Plus,
  Search,
  Tag,
  Trash2,
  Edit,
  Package,
  Layers,
  ShieldAlert,
  RefreshCw,
  Flame,
  Info,
  ExternalLink,
  AlertTriangle,
  Eye,
  ShieldCheck,
} from 'lucide-react';

/**
 * Dashboard de Produtos com Isolamento Escopado Multi-tenant (Scoped Product Domain Dashboard Viewport com suporte a Sale, Atributos Customizados e Telemetria de Estoque/Buscas para Admin)
 */
export const DashboardPage: React.FC = () => {
  const { user, tenantOverride } = useAuthStore();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros de busca (Search & Category & Sale Filter State)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [onlySaleFilter, setOnlySaleFilter] = useState(false);

  // Controle dos Modais (Product Mutation & Product Detail Modal State)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<IProduct | null>(null);

  // Empresas para Superadmin (Companies List for Superadmin Creation Scope)
  const [companies, setCompanies] = useState<ICompany[]>([]);

  const isCanMutate = user?.role === 'admin' || user?.role === 'superadmin';

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productApi.getProducts({
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
        isSale: onlySaleFilter ? true : undefined,
      });
      setProducts(response.products);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Falha ao carregar produtos.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, onlySaleFilter, tenantOverride]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      companyApi
        .getCompanies()
        .then((res) => setCompanies(res.companies))
        .catch((err) => console.error('Erro ao buscar empresas:', err));
    }
  }, [user?.role]);

  const handleSelectProduct = (product: IProduct) => {
    // Incrementa cliques silenciosamente no backend
    productApi.trackClick(product._id).catch((err) => console.error('Erro ao registrar clique:', err));
    setSelectedProductForDetail(product);
  };

  const handleCreateProduct = async (productData: ICreateProductPayload) => {
    try {
      await productApi.createProduct(productData);
      fetchProducts();
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleUpdateProduct = async (productData: Partial<ICreateProductPayload>) => {
    if (!editingProduct) return;
    try {
      await productApi.updateProduct(editingProduct._id, productData);
      fetchProducts();
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto? (Confirm product deletion)')) return;

    try {
      await productApi.deleteProduct(id);
      fetchProducts();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao excluir produto.');
    }
  };

  // Extração de Categorias Únicas (Extract Unique Categories for Quick Filtering)
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Cálculos de Telemetria de Estoque e Engajamento para Admins (Admin Analytics Metrics)
  const mostClickedProducts = [...products].sort((a, b) => (b.clicksCount || 0) - (a.clicksCount || 0)).slice(0, 3);
  const mostSearchedProducts = [...products].sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0)).slice(0, 3);
  const lowStockProducts = products.filter(
    (p) => !p.isDigital && (p.stockQuantity !== undefined ? p.stockQuantity : 25) < 10
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Cabeçalho Padronizado */}
      <PageHeader
        icon={Package}
        title="Catálogo de Produtos"
        subtitle={
          isCanMutate
            ? 'Gerencie o catálogo da sua empresa, estoque físico, engajamento e métricas de busca.'
            : 'Visualização do catálogo de produtos da empresa'
        }
        actions={
          <>
            <button
              onClick={fetchProducts}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors"
              title="Atualizar Produtos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {isCanMutate && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Novo Produto
              </button>
            )}
          </>
        }
      />

      {/* Barra de Filtros e Busca (Search & Filtering Toolbar) */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-md shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, descrição, atributos ou categoria..."
            className="w-full bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-700/60 rounded-xl px-3.5 py-2 pl-10 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Toggle Switch: Apenas Sale 🔥 */}
          <button
            type="button"
            onClick={() => setOnlySaleFilter(!onlySaleFilter)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-700/60 hover:border-purple-500/40 transition-all cursor-pointer select-none shadow-sm"
            title="Filtrar apenas produtos em promoção"
          >
            <div
              className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${onlySaleFilter ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div
                className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-300 ${onlySaleFilter ? 'translate-x-3.5' : 'translate-x-0'}`}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Flame className={`w-3.5 h-3.5 ${onlySaleFilter ? 'text-orange-500' : 'text-slate-400'}`} />
              Apenas Sale
            </span>
          </button>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors w-full md:w-auto shadow-sm"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mensagem de Erro (Error Banner) */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Grid de Produtos (Responsive Products Grid) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-72 bg-slate-200 dark:bg-slate-900/50 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
          <Package className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Nenhum produto encontrado</h3>
          <p className="text-sm text-slate-500">Tente ajustar os termos de busca ou cadastrar um novo produto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const hasSale = product.isSale && product.salePrice && product.salePrice > 0;
            const discountPercent = hasSale
              ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
              : 0;

            return (
              <div
                key={product._id}
                onClick={() => handleSelectProduct(product)}
                className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-xl hover:border-purple-500/50 dark:hover:border-purple-500/50 hover:-translate-y-0.5 cursor-pointer transition-all duration-300"
              >
                {/* Imagem do Produto (Product Image Component com Badges) */}
                <div className="h-44 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
                    }}
                  />

                  {/* Badge de Categoria */}
                  <span className="absolute top-3 left-3 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-purple-600 dark:text-purple-400 flex items-center gap-1 shadow-sm">
                    <Tag className="w-3 h-3" /> {product.category}
                  </span>

                  {/* Badge Promocional "🔥 SALE" */}
                  {hasSale && (
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1 animate-pulse">
                      <Flame className="w-3.5 h-3.5" /> SALE -{discountPercent}%
                    </span>
                  )}

                  {user?.role === 'superadmin' && typeof product.company_id === 'object' && (
                    <span className="absolute bottom-3 left-3 bg-purple-100 dark:bg-purple-950/80 backdrop-blur-md text-[11px] font-medium px-2 py-0.5 rounded-lg border border-purple-300 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 shadow-sm">
                      🏢 {product.company_id.name}
                    </span>
                  )}
                </div>

                {/* Informações do Produto (Product Info Details) */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed font-normal">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">
                        {hasSale ? 'Preço Promocional' : 'Preço'}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          R${' '}
                          {(hasSale ? product.salePrice! : product.price).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        {hasSale && (
                          <span className="text-xs text-slate-400 line-through">
                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações de Edição e Exclusão para Admins (Admin Mutation Controls) */}
                    {isCanMutate && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-all"
                          title="Editar Produto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product._id);
                          }}
                          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all"
                          title="Excluir Produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição (Mutation Modal Component) */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={editingProduct ? handleUpdateProduct : handleCreateProduct}
        productToEdit={editingProduct}
        companies={companies}
        isSuperAdmin={user?.role === 'superadmin'}
      />

      {/* Modal de Detalhes do Produto em Destaque */}
      <ProductDetailModal
        isOpen={!!selectedProductForDetail}
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
      />
    </div>
  );
};
