// src/services/coupon.services.ts
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Coupon, { CouponTypes, CouponApplicability } from '../models/schemas/Coupon.schema'

class CouponService {
  async createCoupon({
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
    starts_at,
    expires_at,
    is_active = true
  }: {
    code: string
    description: string
    type: CouponTypes
    value: number
    min_purchase?: number
    max_discount?: number
    applicability: CouponApplicability
    product_ids?: string[]
    category_ids?: string[]
    created_by: string
    usage_limit?: number
    starts_at: Date
    expires_at: Date
    is_active?: boolean
  }) {
    // Check if coupon code already exists
    const existingCoupon = await databaseService.coupons.findOne({ code })
    if (existingCoupon) {
      throw new Error('Coupon code already exists')
    }

    // Create coupon
    const coupon = new Coupon({
      code,
      description,
      type,
      value,
      min_purchase,
      max_discount,
      applicability,
      product_ids: product_ids?.map((id) => new ObjectId(id)),
      category_ids: category_ids?.map((id) => new ObjectId(id)),
      created_by: new ObjectId(created_by),
      usage_limit,
      usage_count: 0,
      starts_at,
      expires_at,
      is_active
    })

    const result = await databaseService.coupons.insertOne(coupon)

    return { ...coupon, _id: result.insertedId }
  }

  async updateCoupon(
    coupon_id: string,
    {
      description,
      type,
      value,
      min_purchase,
      max_discount,
      applicability,
      product_ids,
      category_ids,
      usage_limit,
      starts_at,
      expires_at,
      is_active
    }: {
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
  ) {
    const updateData: any = {}

    // Only include fields that are provided in the payload
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = value

    if (min_purchase !== undefined) {
      updateData.min_purchase = min_purchase === null ? null : min_purchase
    }

    if (max_discount !== undefined) {
      updateData.max_discount = max_discount === null ? null : max_discount
    }

    if (applicability !== undefined) updateData.applicability = applicability

    if (product_ids !== undefined) {
      updateData.product_ids = product_ids === null ? null : product_ids.map((id) => new ObjectId(id))
    }

    if (category_ids !== undefined) {
      updateData.category_ids = category_ids === null ? null : category_ids.map((id) => new ObjectId(id))
    }

    if (usage_limit !== undefined) {
      updateData.usage_limit = usage_limit === null ? null : usage_limit
    }

    if (starts_at !== undefined) updateData.starts_at = starts_at
    if (expires_at !== undefined) updateData.expires_at = expires_at
    if (is_active !== undefined) updateData.is_active = is_active

    // Add updated_at timestamp
    updateData.updated_at = new Date()

    await databaseService.coupons.findOneAndUpdate({ _id: new ObjectId(coupon_id) }, { $set: updateData })

    return this.getCouponById(coupon_id)
  }

  async getCouponById(coupon_id: string) {
    return databaseService.coupons.findOne({ _id: new ObjectId(coupon_id) })
  }

  async getCouponByCode(code: string) {
    return databaseService.coupons.findOne({ code })
  }

  async deleteCoupon(coupon_id: string) {
    const result = await databaseService.coupons.deleteOne({ _id: new ObjectId(coupon_id) })
    return { success: result.deletedCount > 0 }
  }

  async getCoupons({
    filter = {},
    limit = 20,
    page = 1,
    sort = 'created_at',
    order = 'desc'
  }: {
    filter?: any
    limit?: number
    page?: number
    sort?: string
    order?: 'asc' | 'desc'
  } = {}) {
    const skip = (page - 1) * limit

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.coupons.countDocuments(filter)

    // Get coupons
    const coupons = await databaseService.coupons.find(filter).sort(sortOption).skip(skip).limit(limit).toArray()

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      coupons,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async incrementUsageCount(code: string) {
    await databaseService.coupons.updateOne(
      { code },
      {
        $inc: { usage_count: 1 },
        $currentDate: { updated_at: true }
      }
    )
  }

  async validateCoupon(code: string, subtotal: number, product_ids?: ObjectId[], category_ids?: ObjectId[]) {
    // Get coupon
    const coupon = await this.getCouponByCode(code)

    if (!coupon || !coupon.is_active) {
      return {
        valid: false,
        message: 'Coupon not found or inactive'
      }
    }

    // Check if coupon is expired
    const now = new Date()
    if (now < coupon.starts_at || now > coupon.expires_at) {
      return {
        valid: false,
        message: 'Coupon has expired or not yet active'
      }
    }

    // Check if coupon has reached usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return {
        valid: false,
        message: 'Coupon usage limit has been reached'
      }
    }

    // Check min purchase requirement
    if (coupon.min_purchase && subtotal < coupon.min_purchase) {
      return {
        valid: false,
        message: `Minimum purchase amount of $${coupon.min_purchase.toFixed(2)} required`
      }
    }

    // Check coupon applicability
    if (coupon.applicability !== 'all_products' && product_ids) {
      let isApplicable = false

      if (coupon.applicability === 'specific_products' && coupon.product_ids) {
        // Check if any product is applicable
        isApplicable = product_ids.some((pid) =>
          coupon.product_ids?.some((couponPid) => couponPid.toString() === pid.toString())
        )
      } else if (coupon.applicability === 'specific_categories' && coupon.category_ids && category_ids) {
        // Check if any category is applicable
        isApplicable = category_ids.some((cid) =>
          coupon.category_ids?.some((couponCid) => couponCid.toString() === cid.toString())
        )
      }

      if (!isApplicable) {
        return {
          valid: false,
          message: 'Coupon is not applicable to the items in your cart'
        }
      }
    }

    // Calculate discount amount
    let discountAmount = 0
    if (coupon.type === 'percentage') {
      discountAmount = subtotal * (coupon.value / 100)

      // Apply max discount if specified
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount
      }
    } else {
      // fixed amount
      discountAmount = coupon.value

      // Don't exceed subtotal
      if (discountAmount > subtotal) {
        discountAmount = subtotal
      }
    }

    return {
      valid: true,
      coupon,
      discount_amount: discountAmount,
      subtotal_before_discount: subtotal,
      subtotal_after_discount: subtotal - discountAmount
    }
  }

  async getActiveCoupons() {
    const now = new Date()

    return databaseService.coupons
      .find({
        is_active: true,
        starts_at: { $lte: now },
        expires_at: { $gte: now }
      })
      .toArray()
  }
}

const couponService = new CouponService()
export default couponService
