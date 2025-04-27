import configBase from '@/constants/config'
import { typeParams } from '@/types/reference.type'
import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

// Request types
export interface CreateInventoryRequest {
  product_id: string
  quantity: number
  sku?: string
  location?: string
}

export interface UpdateInventoryRequest {
  quantity?: number
  sku?: string
  location?: string
  reserved_quantity?: number
}

// Response types
export interface Inventory {
  _id: string
  product_id: string
  quantity: number
  reserved_quantity: number
  sku?: string
  location?: string
  last_restock_date: string
  created_at: string
  updated_at: string
}

export interface InventoryWithProduct extends Inventory {
  product: {
    _id: string
    name: string
    price: number
    image: string
  }
  available_quantity: number
}

export interface InventoryResponse {
  inventories: InventoryWithProduct[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// API implementation
export const InventoryApi = {
  // Create inventory for a product - seller only
  createInventory: (data: CreateInventoryRequest) => http.post<SuccessResponse<Inventory>>('/inventory', data),

  // Update inventory for a product - seller only (for their own products)
  updateInventory: (product_id: string, data: UpdateInventoryRequest) =>
    http.put<SuccessResponse<Inventory>>(`/inventory/${product_id}`, data),

  // Get inventory for a product - seller only (for their own products) or admin
  getInventory: (product_id: string) =>
    http.get<SuccessResponse<Inventory & { available_quantity: number }>>(`/inventory/${product_id}`),

  // Get all inventory for a seller - seller only
  getSellerInventory: (params: typeParams) =>
    http.get<SuccessResponse<InventoryResponse>>('/inventory/seller/me', { params }),

  // Get low stock products - seller only
  getLowStockProducts: (threshold?: number) =>
    http.get<SuccessResponse<InventoryWithProduct[]>>('/inventory/alerts/low-stock', {
      params: { threshold }
    })
}
