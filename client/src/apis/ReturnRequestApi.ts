import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

// Request types
export interface CreateReturnRequestRequest {
  order_id: string
  product_id: string
  reason: ReturnReason
  details: string
  images?: string[]
}

export interface UpdateReturnStatusRequest {
  status: ReturnStatus
  seller_response?: string
  refund_amount?: number
}

// Response types
export interface ReturnRequestResponse {
  _id: string
  order_id: string
  user_id: string
  product_id: string
  reason: ReturnReason
  details: string
  status: ReturnStatus
  images?: string[]
  seller_response?: string
  refund_amount?: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface ReturnRequestDetailResponse extends ReturnRequestResponse {
  order: {
    order_number: string
    status: string
  } | null
  product: {
    name: string
    image: string
  } | null
  item_details: {
    price: number
    quantity: number
  } | null
}

export interface BuyerReturnRequestsResponse {
  return_requests: ReturnRequestDetailResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface SellerReturnRequestsResponse {
  return_requests: (ReturnRequestDetailResponse & {
    buyer: {
      _id: string
      name: string
      username: string
      avatar: string
    } | null
  })[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Enums
export enum ReturnReason {
  DAMAGED = 'damaged',
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  MISSING_PARTS = 'missing_parts',
  NO_LONGER_NEEDED = 'no_longer_needed',
  OTHER = 'other'
}

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Query parameters
export interface ReturnRequestsQueryParams {
  status?: ReturnStatus
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

// API Client
export const ReturnRequestApi = {
  /**
   * Create a return request
   * @role Buyer only (authenticated)
   */
  createReturnRequest: (request: CreateReturnRequestRequest) =>
    http.post<SuccessResponse<ReturnRequestResponse>>('returns', request),

  /**
   * Update a return request status
   * @role Seller of returned item or admin
   */
  updateReturnRequestStatus: (return_id: string, request: UpdateReturnStatusRequest) =>
    http.put<SuccessResponse<ReturnRequestResponse>>(`returns/${return_id}`, request),

  /**
   * Get a specific return request
   * @role Involved parties only (buyer, seller, admin)
   */
  getReturnRequest: (return_id: string) =>
    http.get<SuccessResponse<ReturnRequestDetailResponse>>(`returns/${return_id}`),

  /**
   * Get buyer's return requests
   * @role Authenticated buyer
   */
  getBuyerReturnRequests: (params?: ReturnRequestsQueryParams) =>
    http.get<SuccessResponse<BuyerReturnRequestsResponse>>('returns/buyer/me', { params }),

  /**
   * Get seller's return requests
   * @role Authenticated seller
   */
  getSellerReturnRequests: (params?: ReturnRequestsQueryParams) =>
    http.get<SuccessResponse<SellerReturnRequestsResponse>>('returns/seller/me', { params })
}

export default ReturnRequestApi
