import { Product, CreateProductRequest, UpdateProductRequest, ProductCondition } from '@/types/type'
import { ProductListResponse, SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

/**
 * API client for product management
 * Accessible by: All users (some endpoints have role restrictions)
 */
export const ProductsApi = {
  // Public endpoints (no authentication required)

  /**
   * Get products with filtering and pagination
   * @access Public
   */
  getProducts: (params?: {
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
    category_id?: string
    min_price?: number
    max_price?: number
    condition?: ProductCondition
    free_shipping?: boolean
    search?: string
    seller_id?: string
    status?: string
  }) => http.get<SuccessResponse<ProductListResponse>>('/products', { params }),

  /**
   * Get a single product by ID
   * @access Public
   */
  getProduct: (product_id: string) =>
    http.get<SuccessResponse<{ message: string; result: Product }>>(`/products/${product_id}`),

  // Protected endpoints (authentication required)

  /**
   * Create a new product
   * @access Private - Seller only
   */
  createProduct: (params: CreateProductRequest) =>
    http.post<SuccessResponse<{ message: string; result: Product }>>('/products', params),

  /**
   * Update a product
   * @access Private - Seller only (owner of product)
   */
  updateProduct: (product_id: string, params: UpdateProductRequest) =>
    http.put<SuccessResponse<{ message: string; result: Product }>>(`/products/${product_id}`, params),

  /**
   * Delete a product (soft delete)
   * @access Private - Seller only (owner of product) or Admin
   */
  deleteProduct: (product_id: string) => http.delete<SuccessResponse<{ message: string }>>(`/products/${product_id}`),

  /**
   * Get seller's products
   * @access Private - Seller only
   */
  getSellerProducts: (params?: {
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
    status?: string
  }) => http.get<SuccessResponse<ProductListResponse>>('/products/seller/me', { params }),

  /**
   * Get related products for a product
   * @access Public
   */
  getRelatedProducts: (product_id: string, limit?: number) =>
    http.get<SuccessResponse<{ result: Product[] }>>(`/products/${product_id}/related`, { params: { limit } })
}
