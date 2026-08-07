import mongoose from 'mongoose';
import { Product, IProduct } from '../models/Product.js';

export interface ISearchProductsCriteria {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isSale?: boolean;
  limit?: number;
}

/**
 * Servidor de Consulta de Produtos com Isolamento Multitenant Forçado (Multitenant Scoped Product Query Service)
 */
export class ProductService {
  /**
   * Executa busca escopada de produtos restringindo estritamente ao companyId (Executes scoped product query locked to companyId)
   */
  static async searchProductsByTenant(
    companyId: string,
    criteria: ISearchProductsCriteria = {}
  ): Promise<IProduct[]> {
    if (!companyId) {
      throw new Error('Identificador de Tenant é obrigatório para consulta (Tenant companyId is mandatory for product query)');
    }

    // Filtro compulsório por company_id (Mandatory partition key filter)
    const filterQuery: any = {
      company_id: new mongoose.Types.ObjectId(companyId),
    };

    // Filtro por produtos em promoção/sale (On Sale filter)
    if (criteria.isSale !== undefined) {
      filterQuery.isSale = criteria.isSale;
    }

    // Filtro por termo de busca no nome ou descrição (Text search in name or description)
    if (criteria.query) {
      filterQuery.$or = [
        { name: { $regex: criteria.query, $options: 'i' } },
        { description: { $regex: criteria.query, $options: 'i' } },
        { category: { $regex: criteria.query, $options: 'i' } },
      ];
    }

    // Filtro por Categoria (Category filter)
    if (criteria.category) {
      filterQuery.category = { $regex: criteria.category, $options: 'i' };
    }

    // Filtro por Faixa de Preço (Price Range filter)
    if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
      filterQuery.price = {};
      if (criteria.minPrice !== undefined) filterQuery.price.$gte = Number(criteria.minPrice);
      if (criteria.maxPrice !== undefined) filterQuery.price.$lte = Number(criteria.maxPrice);
    }

    const limit = criteria.limit && criteria.limit > 0 ? Math.min(criteria.limit, 50) : 20;

    const result = await Product.find(filterQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Se houve busca por palavra-chave, incrementa silenciosamente o contador de buscas dos produtos encontrados
    if (criteria.query && result.length > 0) {
      const productIds = result.map((p) => p._id);
      Product.updateMany({ _id: { $in: productIds } }, { $inc: { searchCount: 1 } }).catch((err) =>
        console.error('Erro ao incrementar searchCount:', err)
      );
    }

    return result as unknown as IProduct[];
  }
}
