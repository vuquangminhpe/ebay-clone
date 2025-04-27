import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

export interface CreateBidRequest {
  amount: number
}

export interface Bid {
  _id: string
  product_id: string
  bidder_id: string
  amount: number
  created_at: string
  updated_at: string
  bidder?: {
    _id: string
    name: string
    username: string
    avatar: string
  }
}

export interface BidProductResponse {
  bids: Bid[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface UserBidResponse {
  bids: (Bid & {
    product: {
      _id: string
      name: string
      image: string
      price: number
      auctionEndTime?: string
    }
    is_highest: boolean
    is_auction_ended: boolean
  })[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface WonAuctionResponse {
  won_auctions: {
    _id: string
    name: string
    description: string
    price: number
    quantity: number
    isAuction: boolean
    auctionEndTime: string
    winning_bid: number
    medias: { url: string; is_primary: boolean }[]
    // Other product properties
  }[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const BidApi = {
  // Place a bid on a product (Buyer)
  placeBid: (productId: string, params: CreateBidRequest) =>
    http.post<SuccessResponse<Bid>>(`bids/${productId}`, params),

  // Get all bids for a product (Public)
  getProductBids: (
    productId: string,
    params?: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }
  ) => http.get<SuccessResponse<BidProductResponse>>(`bids/product/${productId}`, { params }),

  // Get user's bids (Buyer)
  getUserBids: (params?: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }) =>
    http.get<SuccessResponse<UserBidResponse>>(`bids/me`, { params }),

  // Get user's won auctions (Buyer)
  getWonAuctions: (params?: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }) =>
    http.get<SuccessResponse<WonAuctionResponse>>(`bids/won`, { params })
}
