import { ObjectId } from 'mongodb'

export enum CouponTypes {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export enum CouponApplicability {
  ALL_PRODUCTS = 'all_products',
  SPECIFIC_PRODUCTS = 'specific_products',
  SPECIFIC_CATEGORIES = 'specific_categories'
}

interface CouponType {
  _id?: ObjectId
  code: string
  description: string
  type: CouponTypes
  value: number
  min_purchase?: number
  max_discount?: number
  applicability: CouponApplicability
  product_ids?: ObjectId[]
  category_ids?: ObjectId[]
  created_by: ObjectId
  usage_limit?: number
  usage_count: number
  starts_at: Date
  expires_at: Date
  is_active: boolean
  created_at?: Date
  updated_at?: Date
}

export default class Coupon {
  _id?: ObjectId
  code: string
  description: string
  type: CouponTypes
  value: number
  min_purchase?: number
  max_discount?: number
  applicability: CouponApplicability
  product_ids?: ObjectId[]
  category_ids?: ObjectId[]
  created_by: ObjectId
  usage_limit?: number
  usage_count: number
  starts_at: Date
  expires_at: Date
  is_active: boolean
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    code,
    description,
    type,
    value,
    min_purchase,
    max_discount,
    applicability,
    product_ids,
    category_ids,
    created_by,
    usage_limit,
    usage_count,
    starts_at,
    expires_at,
    is_active,
    created_at,
    updated_at
  }: CouponType) {
    const date = new Date()
    this._id = _id
    this.code = code
    this.description = description
    this.type = type
    this.value = value
    this.min_purchase = min_purchase
    this.max_discount = max_discount
    this.applicability = applicability
    this.product_ids = product_ids
    this.category_ids = category_ids
    this.created_by = created_by
    this.usage_limit = usage_limit
    this.usage_count = usage_count || 0
    this.starts_at = starts_at
    this.expires_at = expires_at
    this.is_active = is_active
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
