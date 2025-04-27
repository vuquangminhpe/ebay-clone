import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

// Request types
export interface CreateReviewRequest {
  product_id: string
  order_id: string
  rating: number
  comment: string
  images?: string[]
}

export interface UpdateReviewRequest {
  rating?: number
  comment?: string
  images?: string[]
}

// Response types
export interface ReviewResponse {
  _id: string
  product_id: string
  order_id: string
  user_id: string
  seller_id: string
  rating: number
  comment: string
  images?: string[]
  created_at: string
  updated_at: string
}

export interface ReviewWithUserResponse extends ReviewResponse {
  user: {
    _id: string
    name: string
    username: string
    avatar: string
  } | null
}

export interface ReviewWithProductResponse extends ReviewResponse {
  product: {
    _id: string
    name: string
    image: string
  } | null
}

export interface ProductReviewsResponse {
  reviews: ReviewWithUserResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  rating_distribution: Record<number, number>
}

export interface SellerReviewsResponse {
  reviews: (ReviewWithUserResponse & {
    product: {
      _id: string
      name: string
      image: string
    } | null
  })[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface UserReviewsResponse {
  reviews: ReviewWithProductResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CanReviewResponse {
  can_review: boolean
  reason?: string
  existing_review?: ReviewResponse
}

// Query parameters
export interface ReviewQueryParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface CheckCanReviewParams {
  product_id: string
  order_id: string
}

// API Client
export const ReviewApi = {
  /**
   * Create a product review
   * @role Authenticated buyer who purchased the product
   */
  createReview: (request: CreateReviewRequest) => http.post<SuccessResponse<ReviewResponse>>('reviews', request),

  /**
   * Update a review
   * @role Author of review only
   */
  updateReview: (review_id: string, request: UpdateReviewRequest) =>
    http.put<SuccessResponse<ReviewResponse>>(`reviews/${review_id}`, request),

  /**
   * Delete a review
   * @role Author of review only
   */
  deleteReview: (review_id: string) => http.delete<SuccessResponse<{ success: boolean }>>(`reviews/${review_id}`),

  /**
   * Get a single review by ID
   * @role Public
   */
  getReview: (review_id: string) => http.get<SuccessResponse<ReviewWithUserResponse>>(`reviews/${review_id}`),

  /**
   * Get reviews for a product
   * @role Public
   */
  getProductReviews: (product_id: string, params?: ReviewQueryParams) =>
    http.get<SuccessResponse<ProductReviewsResponse>>(`reviews/product/${product_id}`, { params }),

  /**
   * Get reviews for a seller
   * @role Public
   */
  getSellerReviews: (seller_id: string, params?: ReviewQueryParams) =>
    http.get<SuccessResponse<SellerReviewsResponse>>(`reviews/seller/${seller_id}`, { params }),

  /**
   * Get current user's reviews
   * @role Authenticated user
   */
  getMyReviews: (params?: ReviewQueryParams) =>
    http.get<SuccessResponse<UserReviewsResponse>>('reviews/me', { params }),

  /**
   * Check if user can review a product from an order
   * @role Authenticated user
   */
  checkCanReview: (params: CheckCanReviewParams) =>
    http.get<SuccessResponse<CanReviewResponse>>('reviews/check-eligibility', { params })
}

export default ReviewApi
