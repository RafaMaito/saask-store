import React, { useState, useEffect } from 'react';
import { IProduct, ICompany } from '../../types/index.js';
import { X, Image as ImageIcon, Sparkles, Tag, Plus, Trash2, Flame } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
  productToEdit?: IProduct | null;
  companies?: ICompany[];
  isSuperAdmin?: boolean;
  showStockFields?: boolean;
}

interface AttributeItem {
  key: string;
  value: string;
}

/**
 * Componente Modal para Criação/Edição de Produtos (Com suporte a Promoções/Sale, Campos Customizados e Light/Dark Mode)
 */
export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  companies = [],
  isSuperAdmin = false,
  showStockFields = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [isSale, setIsSale] = useState(false);
  const [salePrice, setSalePrice] = useState<string>('');
  const [isDigital, setIsDigital] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<string>('25');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [customAttributes, setCustomAttributes] = useState<AttributeItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setDescription(productToEdit.description || '');
      setPrice(productToEdit.price ? String(productToEdit.price) : '');
      setIsSale(Boolean(productToEdit.isSale));
      setSalePrice(productToEdit.salePrice ? String(productToEdit.salePrice) : '');
      setIsDigital(Boolean(productToEdit.isDigital));
      setStockQuantity(productToEdit.stockQuantity !== undefined ? String(productToEdit.stockQuantity) : '25');
      setCategory(productToEdit.category || '');
      setImageUrl(productToEdit.imageUrl || '');
      setCompanyId(
        typeof productToEdit.company_id === 'object' ? productToEdit.company_id._id : productToEdit.company_id || ''
      );

      // Converter objeto de atributos em array de Key-Value (Convert attributes map to array)
      if (productToEdit.attributes && typeof productToEdit.attributes === 'object') {
        const items = Object.entries(productToEdit.attributes).map(([k, v]) => ({
          key: k,
          value: String(v),
        }));
        setCustomAttributes(items);
      } else {
        setCustomAttributes([]);
      }
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setIsSale(false);
      setSalePrice('');
      setIsDigital(false);
      setStockQuantity('25');
      setCategory('Eletrônicos');
      setImageUrl('');
      setCompanyId(companies[0]?._id || '');
      setCustomAttributes([]);
    }
    setError('');
  }, [productToEdit, isOpen, companies]);

  if (!isOpen) return null;

  const handleAddAttribute = () => {
    setCustomAttributes((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setCustomAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: 'key' | 'value', val: string) => {
    setCustomAttributes((prev) => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !price || !category) {
      setError('Por favor, preencha todos os campos obrigatórios (Fill all mandatory fields).');
      return;
    }

    if (isSale) {
      if (!salePrice || parseFloat(salePrice) <= 0) {
        setError('O preço promocional deve ser maior que zero (Sale price must be positive).');
        return;
      }
      if (parseFloat(salePrice) >= parseFloat(price)) {
        setError(
          'O preço promocional deve ser menor que o preço original (Sale price must be lower than original price).'
        );
        return;
      }
    }

    // Converte array de chave-valor em objeto (Build attributes object)
    const attributesObj: Record<string, string> = {};
    customAttributes.forEach((attr) => {
      if (attr.key.trim()) {
        attributesObj[attr.key.trim()] = attr.value.trim();
      }
    });

    setLoading(true);
    setError('');

    try {
      await onSave({
        name,
        description,
        price: parseFloat(price),
        isSale,
        salePrice: isSale ? parseFloat(salePrice) : undefined,
        isDigital: showStockFields ? isDigital : (productToEdit?.isDigital ?? false),
        stockQuantity: showStockFields
          ? isDigital
            ? 0
            : parseInt(stockQuantity || '0', 10)
          : (productToEdit?.stockQuantity ?? 25),
        attributes: attributesObj,
        category,
        imageUrl: imageUrl || undefined,
        company_id: isSuperAdmin ? companyId : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao salvar produto.'
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountPercent = () => {
    if (!price || !salePrice || parseFloat(price) <= 0 || parseFloat(salePrice) <= 0) return 0;
    const p = parseFloat(price);
    const sp = parseFloat(salePrice);
    if (sp >= p) return 0;
    return Math.round(((p - sp) / p) * 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho do Modal (Modal Header) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {productToEdit ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário (Form Controls) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              {error}
            </div>
          )}

          {isSuperAdmin && !productToEdit && companies.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Empresa/Tenant de Destino *
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                required
              >
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Notebook Gamer RTX 4060"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Preço Original (BRL) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="299.90"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Categoria *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Eletrônicos"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Configuração de Promoção (Sale / Offer Controls) */}
          <div className="p-4 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Produto em Promoção (On Sale)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Destaque este produto com oferta promocional na loja e no agente de IA
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSale}
                  onChange={(e) => setIsSale(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
              </label>
            </div>

            {isSale && (
              <div className="pt-2 grid grid-cols-2 gap-4 items-center animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-1">
                    Preço Promocional (BRL) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="199.90"
                    className="w-full bg-white dark:bg-slate-950 border border-orange-500/30 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
                    required={isSale}
                  />
                </div>

                {calculateDiscountPercent() > 0 && (
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold text-sm flex items-center justify-center gap-1">
                    <span>🔥 {calculateDiscountPercent()}% OFF</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configuração de Estoque e Tipo Digital (Stock & Digital Product Controls) - Exclusivo para Analytics */}
          {showStockFields && (
            <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Produto Digital (Sem Controle de Estoque Físico)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Marque se for um produto digital, software ou serviço de estoque ilimitado
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDigital}
                    onChange={(e) => setIsDigital(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              {!isDigital && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
                    Quantidade em Estoque (Unidades Físicas) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="25"
                    className="w-full bg-white dark:bg-slate-950 border border-blue-500/30 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    required={!isDigital}
                  />
                </div>
              )}
            </div>
          )}

          {/* Atributos Customizados Dinâmicos (Dynamic Custom Fields / Attributes) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Campos Customizados da Empresa
              </label>

              <button
                type="button"
                onClick={handleAddAttribute}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Campo
              </button>
            </div>

            {customAttributes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Nenhum campo customizado adicionado (ex: Voltagem, Garantia, Cor, Tamanho).
              </p>
            ) : (
              <div className="space-y-2.5">
                {customAttributes.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={attr.key}
                      onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                      placeholder="Nome do Campo (ex: Voltagem)"
                      className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                      placeholder="Valor (ex: 220V)"
                      className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(idx)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remover Campo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição do Produto *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as especificações e características do produto..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> URL da Imagem
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Rodapé (Actions) */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
