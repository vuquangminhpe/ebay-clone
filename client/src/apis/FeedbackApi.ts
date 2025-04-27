import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

// Request types
export interface CreateFeedbackRequest {
  seller_id: string
  order_id: string
  rating: number
  type: FeedbackTypes
  comment: string
  is_public?: boolean
}

export interface ReplyToFeedbackRequest {
  reply: string
}

// Response types
export interface FeedbackResponse {
  _id: string
  seller_id: string
  buyer_id: string
  order_id: string
  rating: number
  type: FeedbackTypes
  comment: string
  is_public: boolean
  reply?: string
  replied_at?: string
  created_at: string
  updated_at: string
}

export interface FeedbackWithBuyerResponse extends FeedbackResponse {
  buyer: {
    _id: string
    name: string
    username: string
    avatar: string
  } | null
}

export interface FeedbackSummary {
  average_rating: number
  counts: {
    positive: number
    neutral: number
    negative: number
    total: number
  }
  positive_percentage: number
}

export interface SellerFeedbackResponse {
  feedback: FeedbackWithBuyerResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  summary: FeedbackSummary
}

export interface BuyerFeedbackResponse {
  feedback: FeedbackWithSellerResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface FeedbackWithSellerResponse extends FeedbackResponse {
  seller: {
    _id: string
    name: string
    username: string
    avatar: string
  } | null
  order: {
    order_number: string
    created_at: string
  } | null
}

// Enum for feedback types
export enum FeedbackTypes {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

// Query parameters
export interface SellerFeedbackParams {
  type?: FeedbackTypes
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface BuyerFeedbackParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

// API Client
export const FeedbackApi = {
  /**
   * Create feedback for a seller
   * @role Buyer only (authenticated)
   */
  createFeedback: (request: CreateFeedbackRequest) => http.post<SuccessResponse<FeedbackResponse>>('feedback', request),

  /**
   * Reply to feedback
   * @role Seller who received the feedback or admin
   */
  replyToFeedback: (feedback_id: string, request: ReplyToFeedbackRequest) =>
    http.post<SuccessResponse<FeedbackResponse>>(`feedback/${feedback_id}/reply`, request),

  /**
   * Get seller's feedback
   * @role Public
   */
  getSellerFeedback: (seller_id: string, params?: SellerFeedbackParams) =>
    http.get<SuccessResponse<SellerFeedbackResponse>>(`feedback/seller/${seller_id}`, { params }),

  /**
   * Get seller's feedback summary
   * @role Public
   */
  getSellerFeedbackSummary: (seller_id: string) =>
    http.get<SuccessResponse<FeedbackSummary>>(`feedback/seller/${seller_id}/summary`),

  /**
   * Get buyer's feedback history
   * @role Private - Buyer only (authenticated)
   */
  getBuyerFeedback: (params?: BuyerFeedbackParams) =>
    http.get<SuccessResponse<BuyerFeedbackResponse>>('feedback/me', { params })
}

export default FeedbackApi
