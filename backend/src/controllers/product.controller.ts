import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { ProductService } from '../services/product.service.js';

/**
 * Controlador de Produtos com Isolamento de Tenant e Operações CRUD (Multi-tenant Product Domain CRUD Controller)
 */
export class ProductController {
  /**
   * Listagem Escopada de Produtos (Get Tenant Scoped Products List)
   */
  static async getProducts(req: Request, res: Response) {
    try {
      const companyId = req.companyId;

      if (!companyId && req.user?.role !== 'superadmin') {
        return res.status(400).json({ error: 'Contexto de empresa não identificado (Company tenant context missing)' });
      }

      const { query, category, minPrice, maxPrice, isSale } = req.query;

      // Se for superadmin e nenhuma empresa específica foi selecionada, retorna todos com paginação (Superadmin global view with pagination)
      if (req.user?.role === 'superadmin' && !companyId) {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;

        const filterQuery: any = {};
        if (query) {
          filterQuery.$or = [
            { name: { $regex: query as string, $options: 'i' } },
            { description: { $regex: query as string, $options: 'i' } },
          ];
        }
        if (category) filterQuery.category = category;
        if (isSale !== undefined) filterQuery.isSale = isSale === 'true';

        const [products, total] = await Promise.all([
          Product.find(filterQuery)
            .populate('company_id', 'name slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Product.countDocuments(filterQuery),
        ]);
        return res.status(200).json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
      }

      // Busca estritamente filtrada pelo escopo da empresa (Strict tenant scoped product query execution)
      const products = await ProductService.searchProductsByTenant(companyId!, {
        query: query as string,
        category: category as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        isSale: isSale !== undefined ? isSale === 'true' : undefined,
      });

      return res.status(200).json({ products });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Detalhes de um Produto por ID (Get Product By ID with Tenant Validation)
   */
  static async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id).lean();

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado (Product not found)' });
      }

      // Validação de segurança multi-tenant (Multi-tenant cross-tenant security check)
      if (req.user?.role !== 'superadmin' && product.company_id.toString() !== req.companyId) {
        return res
          .status(403)
          .json({ error: 'Acesso negado a dados de outra empresa (Cross-tenant access forbidden)' });
      }

      return res.status(200).json({ product });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Criação de Novo Produto (Create Product in Tenant Scope - Admin/Superadmin)
   */
  static async createProduct(req: Request, res: Response) {
    try {
      const {
        name,
        description,
        price,
        category,
        imageUrl,
        company_id,
        isSale,
        salePrice,
        attributes,
        isDigital,
        stockQuantity,
      } = req.body;

      if (!name || !description || price === undefined || !category) {
        return res
          .status(400)
          .json({
            error: 'Campos obrigatórios ausentes: nome, descrição, preço e categoria (Missing required product fields)',
          });
      }

      // Determina o tenant de destino (Determine target tenant company_id)
      let targetCompanyId = req.companyId;
      if (req.user?.role === 'superadmin' && company_id) {
        targetCompanyId = company_id;
      }

      if (!targetCompanyId) {
        return res
          .status(400)
          .json({ error: 'Identificador de empresa de destino é obrigatório (Target company_id is required)' });
      }

      // Validação do preço promocional (Sale Price Security & Integrity Check)
      let parsedSalePrice: number | undefined = undefined;
      if (isSale) {
        if (salePrice === undefined || Number(salePrice) <= 0) {
          return res
            .status(400)
            .json({
              error: 'Informe um preço promocional válido para o produto em promoção (Sale price must be positive)',
            });
        }
        if (Number(salePrice) >= Number(price)) {
          return res
            .status(400)
            .json({
              error:
                'O preço promocional deve ser menor que o preço original (Sale price must be lower than original price)',
            });
        }
        parsedSalePrice = Number(salePrice);
      }

      const product = await Product.create({
        company_id: new mongoose.Types.ObjectId(targetCompanyId),
        name,
        description,
        price: Number(price),
        isSale: Boolean(isSale),
        salePrice: parsedSalePrice,
        attributes: attributes && typeof attributes === 'object' ? attributes : {},
        category,
        imageUrl: imageUrl || undefined,
        isDigital: Boolean(isDigital),
        stockQuantity: isDigital ? 0 : stockQuantity !== undefined ? Number(stockQuantity) : 25,
      });

      return res.status(201).json({
        message: 'Produto cadastrado com sucesso (Product created successfully)',
        product,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Atualização de Produto (Update Product - Admin/Superadmin)
   */
  static async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, price, category, imageUrl, isSale, salePrice, attributes, isDigital, stockQuantity } =
        req.body;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado (Product not found)' });
      }

      // Garantia de Segurança Tenant (Tenant Security Enforcement)
      if (req.user?.role !== 'superadmin' && product.company_id.toString() !== req.companyId) {
        return res
          .status(403)
          .json({ error: 'Acesso negado a dados de outra empresa (Cross-tenant modification forbidden)' });
      }

      if (name !== undefined) product.name = name;
      if (description !== undefined) product.description = description;
      if (price !== undefined) product.price = Number(price);
      if (category !== undefined) product.category = category;
      if (imageUrl !== undefined) product.imageUrl = imageUrl;
      if (isDigital !== undefined) product.isDigital = Boolean(isDigital);
      if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);

      if (isSale !== undefined) {
        product.isSale = Boolean(isSale);
        if (product.isSale) {
          const currentPrice = price !== undefined ? Number(price) : product.price;
          const targetSalePrice = salePrice !== undefined ? Number(salePrice) : product.salePrice;

          if (!targetSalePrice || targetSalePrice <= 0) {
            return res
              .status(400)
              .json({
                error: 'Informe um preço promocional válido para o produto em promoção (Sale price must be positive)',
              });
          }
          if (targetSalePrice >= currentPrice) {
            return res
              .status(400)
              .json({
                error:
                  'O preço promocional deve ser menor que o preço original (Sale price must be lower than original price)',
              });
          }
          product.salePrice = targetSalePrice;
        } else {
          product.salePrice = undefined;
        }
      }

      if (attributes !== undefined && typeof attributes === 'object') {
        product.attributes = attributes;
      }

      await product.save();

      return res.status(200).json({
        message: 'Produto atualizado com sucesso (Product updated successfully)',
        product,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Registro de Clique/Visualização de Produto (Product Click Analytics Logger)
   */
  static async trackProductClick(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndUpdate(id, { $inc: { clicksCount: 1 } }, { new: true });

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      return res.status(200).json({
        message: 'Clique registrado com sucesso',
        clicksCount: product.clicksCount,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Exclusão de Produto (Delete Product - Admin/Superadmin)
   */
  static async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado (Product not found)' });
      }

      // Garantia de Segurança Tenant (Tenant Security Enforcement)
      if (req.user?.role !== 'superadmin' && product.company_id.toString() !== req.companyId) {
        return res
          .status(403)
          .json({ error: 'Acesso negado a dados de outra empresa (Cross-tenant deletion forbidden)' });
      }

      await Product.findByIdAndDelete(id);

      return res.status(200).json({
        message: 'Produto removido com sucesso (Product deleted successfully)',
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
