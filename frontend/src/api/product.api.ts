import { apiClient } from './client.js';
import { IProduct } from '../types/index.js';

export interface IProductFilterParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isSale?: boolean;
  page?: number;
  limit?: number;
}

/** Resposta paginada de listagem de produtos (Paginated product list response) */
export interface IProductListResponse {
  products: IProduct[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ICreateProductPayload {
  name: string;
  description: string;
  price: number;
  isSale?: boolean;
  salePrice?: number;
  attributes?: Record<string, string>;
  category: string;
  imageUrl?: string;
  company_id?: string;
  isDigital?: boolean;
  stockQuantity?: number;
}

export const productApi = {
  getProducts: async (params?: IProductFilterParams): Promise<IProductListResponse> => {
    const { data } = await apiClient.get<IProductListResponse>('/products', { params });
    return data;
  },

  getProductById: async (id: string): Promise<{ product: IProduct }> => {
    const { data } = await apiClient.get<{ product: IProduct }>(`/products/${id}`);
    return data;
  },

  trackClick: async (id: string): Promise<{ clicksCount: number }> => {
    const { data } = await apiClient.post<{ clicksCount: number }>(`/products/${id}/click`);
    return data;
  },

  createProduct: async (payload: ICreateProductPayload): Promise<{ product: IProduct; message: string }> => {
    const { data } = await apiClient.post<{ product: IProduct; message: string }>('/products', payload);
    return data;
  },

  updateProduct: async (
    id: string,
    payload: Partial<ICreateProductPayload>
  ): Promise<{ product: IProduct; message: string }> => {
    const { data } = await apiClient.put<{ product: IProduct; message: string }>(`/products/${id}`, payload);
    return data;
  },

  deleteProduct: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/products/${id}`);
    return data;
  },
};
