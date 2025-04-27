import { Router } from 'express'
import {
  cancelOrderController,
  createOrderController,
  deliverOrderController,
  getBuyerOrdersController,
  getOrderController,
  getOrdersForAdminController,
  getSellerOrdersController,
  payOrderController,
  shipOrderController
} from '../controllers/orders.controllers'
import { AccessTokenValidator, verifiedUserValidator, adminOnlyValidator } from '../middlewares/users.middlewares'
import {
  createOrderValidator,
  cancelOrderValidator,
  payOrderValidator,
  shipOrderValidator,
  deliverOrderValidator
} from '../middlewares/order.middlewares'
import { wrapAsync } from '../utils/handler'

const orderRouter = Router()

// All order routes require authentication
orderRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Create a new order
 * @route POST /orders
 * @access Private
 */
orderRouter.post('/', createOrderValidator, wrapAsync(createOrderController))

/**
 * @description Get order by ID
 * @route GET /orders/:order_id
 * @access Private - Buyer of order, seller of items in order, or admin
 */
orderRouter.get('/:order_id', wrapAsync(getOrderController))

/**
 * @description Get buyer's orders
 * @route GET /orders/buyer/me
 * @access Private - Buyer only
 */
orderRouter.get('/buyer/me', wrapAsync(getBuyerOrdersController))

/**
 * @description Get seller's orders
 * @route GET /orders/seller/me
 * @access Private - Seller only
 */
orderRouter.get('/seller/me', wrapAsync(getSellerOrdersController))

/**
 * @description Cancel an order
 * @route POST /orders/:order_id/cancel
 * @access Private - Buyer of order, seller of items in order, or admin
 */
orderRouter.post('/:order_id/cancel', cancelOrderValidator, wrapAsync(cancelOrderController))

/**
 * @description Pay for an order
 * @route POST /orders/:order_id/pay
 * @access Private - Buyer of order only
 */
orderRouter.post('/:order_id/pay', payOrderValidator, wrapAsync(payOrderController))

/**
 * @description Mark order as shipped
 * @route POST /orders/:order_id/ship
 * @access Private - Seller of items in order or admin
 */
orderRouter.post('/:order_id/ship', shipOrderValidator, wrapAsync(shipOrderController))

/**
 * @description Mark order as delivered
 * @route POST /orders/:order_id/deliver
 * @access Private - Buyer, seller, or admin
 */
orderRouter.post('/:order_id/deliver', deliverOrderValidator, wrapAsync(deliverOrderController))

/**
 * @description Get all orders (admin only)
 * @route GET /orders/admin/all
 * @access Private - Admin only
 */
orderRouter.get('/admin/all', adminOnlyValidator, wrapAsync(getOrdersForAdminController))

export default orderRouter
