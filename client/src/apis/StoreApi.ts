import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'
import { Product } from '@/types/type' // Import Product type if defined elsewhere

// Request types
export interface CreateStoreRequest {
  name: string
  description: string
  logo?: string
  banner?: string
  policy?: string
}

export interface UpdateStoreRequest {
  name?: string
  description?: string
  logo?: string
  banner?: string
  policy?: string
  status?: StoreStatus
}

// Response types
export interface StoreResponse {
  _id: string
  seller_id: string
  name: string
  description: string
  logo?: string
  banner?: string
  policy?: string
  status: StoreStatus
  rating: number
  total_sales: number
  total_products: number
  created_at: string
  updated_at: string
}

export interface StoreWithSellerResponse {
  store: StoreResponse
  seller: {
    _id: string
    name: string
    username: string
    avatar: string
    is_seller_verified: boolean
  }
  featured_products: Product[]
}

export interface StoreWithProductsResponse {
  store: {
    _id: string
    name: string
    rating: number
  }
  products: Product[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface MyStoreResponse {
  store: StoreResponse
  products: Product[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface StoresListResponse {
  stores: StoreResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Enums
export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_REVIEW = 'pending_review'
}

// Query parameters
export interface StoreProductsParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface StoresListParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  include_inactive?: boolean
}

// API Client
export const StoreApi = {
  /**
   * Create a new store
   * @role Authenticated user (buyer who wants to become seller)
   */
  createStore: (request: CreateStoreRequest) => http.post<SuccessResponse<StoreResponse>>('store', request),

  /**
   * Update a store
   * @role Store owner (seller)
   */
  updateStore: (request: UpdateStoreRequest) => http.put<SuccessResponse<StoreResponse>>('store', request),

  /**
   * Get store by ID
   * @role Public
   */
  getStore: (store_id: string) => http.get<SuccessResponse<StoreWithSellerResponse>>(`store/${store_id}`),

  /**
   * Get store by seller ID
   * @role Public
   */
  getStoreBySeller: (seller_id: string) =>
    http.get<SuccessResponse<StoreWithSellerResponse>>(`store/seller/${seller_id}`),

  /**
   * Get current user's store
   * @role Authenticated seller
   */
  getMyStore: () => http.get<SuccessResponse<MyStoreResponse>>('store/me'),

  /**
   * Get stores with filtering and pagination
   * @role Public
   */
  getStores: (params?: StoresListParams) => http.get<SuccessResponse<StoresListResponse>>('store', { params }),

  /**
   * Get products for a store
   * @role Public
   */
  getStoreProducts: (store_id: string, params?: StoreProductsParams) =>
    http.get<SuccessResponse<StoreWithProductsResponse>>(`store/${store_id}/products`, { params }),

  /**
   * Upgrade account to seller
   * @role Authenticated buyer
   */
  upgradeToSeller: () => http.post<SuccessResponse<{ message: string }>>('store/upgrade-to-seller'),

  /**
   * Get top-rated stores
   * @role Public
   */
  getTopStores: () => http.get<SuccessResponse<StoreResponse[]>>('store/top')
}

export default StoreApi
