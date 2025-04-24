// src/models/request/Coupon.request.ts
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { CouponApplicability, CouponTypes } from '../schemas/Coupon.schema'

export interface CreateCouponReqBody {
  code: string
  description: string
  type: CouponTypes
  value: number
  min_purchase?: number
  max_discount?: number
  applicability: CouponApplicability
  product_ids?: string[]
  category_ids?: string[]
  usage_limit?: number
  starts_at: Date
  expires_at: Date
  is_active?: boolean
}

export interface UpdateCouponReqBody {
  description?: string
  type?: CouponTypes
  value?: number
  min_purchase?: number | null
  max_discount?: number | null
  applicability?: CouponApplicability
  product_ids?: string[] | null
  category_ids?: string[] | null
  usage_limit?: number | null
  starts_at?: Date
  expires_at?: Date
  is_active?: boolean
}

export interface CouponParams extends ParamsDictionary {
  coupon_id: string
}

export interface CouponQuery extends Query {
  page?: string
  limit?: string
  sort?: string
  order?: 'asc' | 'desc'
  is_active?: string
}
