import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface CreateReviewReqBody {
  product_id: string
  order_id: string
  rating: number
  comment: string
  images?: string[]
}

export interface UpdateReviewReqBody {
  rating?: number
  comment?: string
  images?: string[]
}

export interface ReviewParams extends ParamsDictionary {
  review_id: string
}

export interface ProductReviewParams extends ParamsDictionary {
  product_id: string
}

export interface SellerReviewParams extends ParamsDictionary {
  seller_id: string
}

export interface ReviewQuery extends Query {
  page?: string
  limit?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface CheckCanReviewQuery extends Query {
  product_id: string
  order_id: string
}