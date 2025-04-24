import { Router } from 'express'
import {
  capturePaypalPaymentController,
  createPaypalPaymentController,
  getOrderPaymentsController,
  getPaymentStatusController,
  paypalWebhookController,
  refundPaymentController
} from '../controllers/payment.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'

const paymentRouter = Router()

/**
 * @description Create a PayPal payment for an order
 * @route POST /payments/paypal/order/:order_id
 * @body return_url - URL to redirect on successful payment
 * @body cancel_url - URL to redirect on cancelled payment
 * @access Private - Buyer of order only
 */
paymentRouter.post(
  '/paypal/order/:order_id',
  AccessTokenValidator,
  verifiedUserValidator,
  wrapAsync(createPaypalPaymentController)
)

/**
 * @description Capture a PayPal payment after approval
 * @route POST /payments/paypal/capture/:order_id
 * @body paypal_order_id - PayPal order ID from approval process
 * @access Private
 */
paymentRouter.post(
  '/paypal/capture/:order_id',
  AccessTokenValidator,
  verifiedUserValidator,
  wrapAsync(capturePaypalPaymentController)
)

/**
 * @description Get payment status
 * @route GET /payments/:payment_id
 * @access Private - Buyer of order, seller of items in order, or admin
 */
paymentRouter.get('/:payment_id', AccessTokenValidator, verifiedUserValidator, wrapAsync(getPaymentStatusController))

/**
 * @description Get all payments for an order
 * @route GET /payments/order/:order_id
 * @access Private - Buyer of order, seller of items in order, or admin
 */
paymentRouter.get(
  '/order/:order_id',
  AccessTokenValidator,
  verifiedUserValidator,
  wrapAsync(getOrderPaymentsController)
)

/**
 * @description Refund a payment
 * @route POST /payments/:payment_id/refund
 * @body amount - Optional amount for partial refund
 * @body reason - Optional reason for refund
 * @access Private - Seller of items in order or admin only
 */
paymentRouter.post(
  '/:payment_id/refund',
  AccessTokenValidator,
  verifiedUserValidator,
  wrapAsync(refundPaymentController)
)

/**
 * @description Handle PayPal webhooks
 * @route POST /payments/webhooks/paypal
 * @access Public - Used by PayPal for notifications
 */
paymentRouter.post('/webhooks/paypal', wrapAsync(paypalWebhookController))

export default paymentRouter
