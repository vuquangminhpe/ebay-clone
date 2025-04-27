// src/controllers/coupon.controllers.ts
import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { COUPON_MESSAGE } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import { UserRole } from '../models/schemas/User.schema'
import couponService from '../services/coupon.services'
import { CreateCouponReqBody, UpdateCouponReqBody, CouponParams, CouponQuery } from '../models/request/Coupon.request'
import productService from '~/services/products.services'
import cartService from '~/services/carts.services'

export const createCouponController = async (
  req: Request<ParamsDictionary, any, CreateCouponReqBody>,
  res: Response
) => {
  const { user_id, role } = req.decode_authorization as TokenPayload

  // Only admin can create coupons
  if (role !== UserRole.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: COUPON_MESSAGE.ADMIN_ONLY
    })
  }

  try {
    // Create coupon
    const result = await couponService.createCoupon({
      ...req.body,
      starts_at: new Date(req.body.starts_at),
      expires_at: new Date(req.body.expires_at),
      created_by: user_id
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: COUPON_MESSAGE.CREATE_COUPON_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Create coupon error:', error)
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error instanceof Error ? error.message : 'Failed to create coupon'
    })
  }
}

export const updateCouponController = async (req: Request<CouponParams, any, UpdateCouponReqBody>, res: Response) => {
  const { role } = req.decode_authorization as TokenPayload
  const { coupon_id } = req.params

  // Only admin can update coupons
  if (role !== UserRole.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: COUPON_MESSAGE.ADMIN_ONLY
    })
  }

  try {
    // Check if coupon exists
    const coupon = await couponService.getCouponById(coupon_id)
    if (!coupon) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: COUPON_MESSAGE.COUPON_NOT_FOUND
      })
    }

    // Process dates if provided
    const updateData: any = { ...req.body }
    if (updateData.starts_at) updateData.starts_at = new Date(updateData.starts_at)
    if (updateData.expires_at) updateData.expires_at = new Date(updateData.expires_at)

    // Update coupon
    const result = await couponService.updateCoupon(coupon_id, updateData)

    return res.status(HTTP_STATUS.OK).json({
      message: COUPON_MESSAGE.UPDATE_COUPON_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Update coupon error:', error)
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error instanceof Error ? error.message : 'Failed to update coupon'
    })
  }
}

export const deleteCouponController = async (req: Request<CouponParams>, res: Response) => {
  const { role } = req.decode_authorization as TokenPayload
  const { coupon_id } = req.params

  // Only admin can delete coupons
  if (role !== UserRole.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: COUPON_MESSAGE.ADMIN_ONLY
    })
  }

  try {
    // Check if coupon exists
    const coupon = await couponService.getCouponById(coupon_id)
    if (!coupon) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: COUPON_MESSAGE.COUPON_NOT_FOUND
      })
    }

    // Delete coupon
    await couponService.deleteCoupon(coupon_id)

    return res.status(HTTP_STATUS.OK).json({
      message: COUPON_MESSAGE.DELETE_COUPON_SUCCESS
    })
  } catch (error) {
    console.error('Delete coupon error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to delete coupon'
    })
  }
}

export const getCouponController = async (req: Request<CouponParams>, res: Response) => {
  const { role } = req.decode_authorization as TokenPayload
  const { coupon_id } = req.params

  // Only admin can get coupon details
  if (role !== UserRole.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: COUPON_MESSAGE.ADMIN_ONLY
    })
  }

  try {
    // Get coupon
    const coupon = await couponService.getCouponById(coupon_id)

    if (!coupon) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: COUPON_MESSAGE.COUPON_NOT_FOUND
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: COUPON_MESSAGE.GET_COUPON_SUCCESS,
      result: coupon
    })
  } catch (error) {
    console.error('Get coupon error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get coupon'
    })
  }
}

export const getCouponsController = async (req: Request<ParamsDictionary, any, any, CouponQuery>, res: Response) => {
  const { role } = req.decode_authorization as TokenPayload
  const { page = '1', limit = '20', sort = 'created_at', order = 'desc', is_active } = req.query

  // Only admin can list all coupons
  if (role !== UserRole.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: COUPON_MESSAGE.ADMIN_ONLY
    })
  }

  try {
    // Build filter
    const filter: any = {}

    if (is_active !== undefined) {
      filter.is_active = is_active === 'true'
    }

    // Get coupons
    const result = await couponService.getCoupons({
      filter,
      limit: parseInt(limit),
      page: parseInt(page),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: COUPON_MESSAGE.GET_COUPONS_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Get coupons error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get coupons'
    })
  }
}

export const validateCouponController = async (req: Request, res: Response) => {
  const { coupon_code } = req.body

  if (!coupon_code) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Coupon code is required'
    })
  }

  try {
    // Get cart to validate against subtotal
    const { user_id } = req.decode_authorization as TokenPayload

    const cart = await cartService.getCart(user_id)
    if (!cart) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Cart not found'
      })
    }
    // Calculate subtotal from selected items
    const selectedItems = (cart.items as any).filter((item: { selected: any }) => item.selected)
    if (selectedItems.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'No items selected in cart'
      })
    }

    const subtotal = selectedItems.reduce(
      (total: number, item: { price: number; quantity: number }) => total + item.price * item.quantity,
      0
    )

    const productIds = selectedItems.map((item: { product_id: any }) => item.product_id)
    const products = await productService.getProductsByIds(productIds)
    const categoryIds = products.map((product: { category_id: any }) => product.category_id)

    // Validate coupon against cart
    const result = await couponService.validateCoupon(coupon_code, subtotal, productIds, categoryIds)

    if (!result.valid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: result.message
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: COUPON_MESSAGE.COUPON_VALID,
      result
    })
  } catch (error) {
    console.error('Validate coupon error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to validate coupon'
    })
  }
}

export const getActiveCouponsController = async (req: Request, res: Response) => {
  try {
    const coupons = await couponService.getActiveCoupons()

    // Return minimal coupon details for public viewing
    const publicCoupons = coupons.map((coupon) => ({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_purchase: coupon.min_purchase,
      expires_at: coupon.expires_at,
      description: coupon.description
    }))

    return res.status(HTTP_STATUS.OK).json({
      message: COUPON_MESSAGE.GET_COUPONS_SUCCESS,
      result: publicCoupons
    })
  } catch (error) {
    console.error('Get active coupons error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get active coupons'
    })
  }
}
