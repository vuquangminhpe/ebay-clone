// src/routes/payment.routes.ts
import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  addPaymentMethodController,
  capturePaypalPaymentController,
  createPaypalOrderController,
  deletePaymentMethodController,
  getSellerTransactionsController,
  getUserPaymentMethodsController,
  getUserTransactionsController,
  setDefaultPaymentMethodController
} from '../controllers/payment.controllers'

const paymentRouter = Router()

// Public routes for PayPal flow (non-authenticated)
/**
 * @description Create PayPal order
 * @route POST /payments/paypal/create-order
 * @access Public
 */
paymentRouter.post('/paypal/create-order', wrapAsync(createPaypalOrderController))

// Protected routes - require authentication
paymentRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Add a payment method
 * @route POST /payments/methods
 * @access Private
 */
paymentRouter.post('/methods', wrapAsync(addPaymentMethodController))

/**
 * @description Get user's payment methods
 * @route GET /payments/methods
 * @access Private
 */
paymentRouter.get('/methods', wrapAsync(getUserPaymentMethodsController))

/**
 * @description Set default payment method
 * @route PUT /payments/methods/:payment_method_id/default
 * @access Private
 */
paymentRouter.put('/methods/:payment_method_id/default', wrapAsync(setDefaultPaymentMethodController))

/**
 * @description Delete payment method
 * @route DELETE /payments/methods/:payment_method_id
 * @access Private
 */
paymentRouter.delete('/methods/:payment_method_id', wrapAsync(deletePaymentMethodController))

/**
 * @description Capture PayPal payment
 * @route POST /payments/paypal/capture
 * @access Private
 */
paymentRouter.post('/paypal/capture', wrapAsync(capturePaypalPaymentController))

/**
 * @description Get user transactions
 * @route GET /payments/transactions/buyer
 * @access Private
 */
paymentRouter.get('/transactions/buyer', wrapAsync(getUserTransactionsController))

/**
 * @description Get seller transactions
 * @route GET /payments/transactions/seller
 * @access Private
 */
paymentRouter.get('/transactions/seller', wrapAsync(getSellerTransactionsController))

export default paymentRouter
