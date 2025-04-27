import { typeParams } from '@/types/typeParams'
import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

// Request types
export interface CreateCouponRequest {
  code: string
  description: string
  type: 'percentage' | 'fixed'
  value: number
  min_purchase?: number
  max_discount?: number
  applicability: 'all_products' | 'specific_products' | 'specific_categories'
  product_ids?: string[]
  category_ids?: string[]
  usage_limit?: number
  starts_at: string // ISO date string
  expires_at: string // ISO date string
  is_active?: boolean
}

export interface UpdateCouponRequest {
  description?: string
  type?: 'percentage' | 'fixed'
  value?: number
  min_purchase?: number | null
  max_discount?: number | null
  applicability?: 'all_products' | 'specific_products' | 'specific_categories'
  product_ids?: string[] | null
  category_ids?: string[] | null
  usage_limit?: number | null
  starts_at?: string // ISO date string
  expires_at?: string // ISO date string
  is_active?: boolean
}

export interface ValidateCouponRequest {
  coupon_code: string
}

// Response types
export interface Coupon {
  _id: string
  code: string
  description: string
  type: 'percentage' | 'fixed'
  value: number
  min_purchase?: number
  max_discount?: number
  applicability: 'all_products' | 'specific_products' | 'specific_categories'
  product_ids?: string[]
  category_ids?: string[]
  created_by: string
  usage_limit?: number
  usage_count: number
  starts_at: string
  expires_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CouponValidationResult {
  valid: boolean
  coupon?: Coupon
  discount_amount: number
  subtotal_before_discount: number
  subtotal_after_discount: number
  message?: string
}

export interface PublicCoupon {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_purchase?: number
  expires_at: string
  description: string
}

export interface CouponPagination {
  coupons: Coupon[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// API implementation
export const CouponApi = {
  // Admin endpoints - requires admin role
  createCoupon: (data: CreateCouponRequest) => http.post<SuccessResponse<Coupon>>('/coupons', data),

  getCoupons: (params: typeParams & { is_active?: boolean }) =>
    http.get<SuccessResponse<CouponPagination>>('/coupons', { params }),

  getCoupon: (coupon_id: string) => http.get<SuccessResponse<Coupon>>(`/coupons/${coupon_id}`),

  updateCoupon: (coupon_id: string, data: UpdateCouponRequest) =>
    http.put<SuccessResponse<Coupon>>(`/coupons/${coupon_id}`, data),

  deleteCoupon: (coupon_id: string) => http.delete<SuccessResponse<{ success: boolean }>>(`/coupons/${coupon_id}`),

  // Public endpoints
  getActiveCoupons: () => http.get<SuccessResponse<PublicCoupon[]>>('/coupons/active'),

  validateCoupon: (data: ValidateCouponRequest) =>
    http.post<SuccessResponse<CouponValidationResult>>('/coupons/validate', data)
}
