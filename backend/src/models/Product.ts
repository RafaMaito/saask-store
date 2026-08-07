import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface do Modelo do Domínio de Produtos (Product Domain Model Interface)
 */
export interface IProduct extends Document {
  company_id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  isSale?: boolean;
  salePrice?: number;
  attributes?: Record<string, string>;
  category: string;
  imageUrl: string;
  isDigital?: boolean;
  stockQuantity?: number;
  clicksCount?: number;
  searchCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema Mongoose com Particionamento Lógico Multi-Tenant (Multi-Tenant Logical Partitioning Schema)
 */
const ProductSchema: Schema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Identificador de Tenant é obrigatório (Company tenant ID is required)'],
      index: true, // Índice para acelerar a busca isolada (Index for accelerated scoped queries)
    },
    name: {
      type: String,
      required: [true, 'Nome do produto é obrigatório (Product name is required)'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Descrição do produto é obrigatória (Product description is required)'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Preço é obrigatório (Product price is required)'],
      min: [0, 'O preço não pode ser negativo (Price cannot be negative)'],
    },
    isSale: {
      type: Boolean,
      default: false,
      index: true,
    },
    salePrice: {
      type: Number,
      min: [0, 'O preço promocional não pode ser negativo (Sale price cannot be negative)'],
    },
    attributes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    category: {
      type: String,
      required: [true, 'Categoria é obrigatória (Product category is required)'],
      trim: true,
      index: true,
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    stockQuantity: {
      type: Number,
      default: 25,
      min: [0, 'O estoque não pode ser negativo'],
    },
    clicksCount: {
      type: Number,
      default: 0,
    },
    searchCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Índice composto para busca multi-tenant otimizada (Compound index for optimized multi-tenant search)
ProductSchema.index({ company_id: 1, name: 'text', description: 'text', category: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
