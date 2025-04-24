// src/routes/coupon.routes.ts
import { Router } from 'express'
import {
  createCouponController,
  deleteCouponController,
  getActiveCouponsController,
  getCouponController,
  getCouponsController,
  updateCouponController,
  validateCouponController
} from '../controllers/coupon.controllers'
import { AccessTokenValidator, adminOnlyValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { createCouponValidator, updateCouponValidator } from '../middlewares/coupon.middlewares'
import { wrapAsync } from '../utils/handler'

const couponRouter = Router()

/**
 * @description Get public active coupons
 * @route GET /coupons/active
 * @access Public
 */
couponRouter.get('/active', wrapAsync(getActiveCouponsController))

/**
 * Protected routes - require authentication
 */
couponRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Validate a coupon code
 * @route POST /coupons/validate
 * @access Private
 */
couponRouter.post('/validate', wrapAsync(validateCouponController))

/**
 * Admin-only routes
 */
couponRouter.use(adminOnlyValidator)

/**
 * @description Create a new coupon
 * @route POST /coupons
 * @access Private (Admin only)
 */
couponRouter.post('/', createCouponValidator, wrapAsync(createCouponController))

/**
 * @description Get all coupons with pagination
 * @route GET /coupons
 * @access Private (Admin only)
 */
couponRouter.get('/', wrapAsync(getCouponsController))

/**
 * @description Get a single coupon by ID
 * @route GET /coupons/:coupon_id
 * @access Private (Admin only)
 */
couponRouter.get('/:coupon_id', wrapAsync(getCouponController))

/**
 * @description Update a coupon
 * @route PUT /coupons/:coupon_id
 * @access Private (Admin only)
 */
couponRouter.put('/:coupon_id', updateCouponValidator, wrapAsync(updateCouponController))

/**
 * @description Delete a coupon
 * @route DELETE /coupons/:coupon_id
 * @access Private (Admin only)
 */
couponRouter.delete('/:coupon_id', wrapAsync(deleteCouponController))

export default couponRouter
