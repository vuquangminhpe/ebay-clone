import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import orderService from '../services/orders.services'
import paymentService, { PaymentProvider } from '../services/payment.services'
import { OrderStatus } from '../constants/enums'
import { ErrorWithStatus } from '../models/Errors'

export const createPaypalPaymentController = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload
    const { order_id } = req.params
    const { return_url, cancel_url } = req.body

    // Validate required fields
    if (!return_url || !cancel_url) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Return URL and cancel URL are required'
      })
    }

    // Get order details
    const order = await orderService.getOrderById(order_id)

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Order not found'
      })
    }

    // Check if order belongs to the user
    if (order.buyer_id.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'You are not authorized to make payment for this order'
      })
    }

    // Check if order is in correct status for payment
    if (order.status !== OrderStatus.PENDING) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `Payment cannot be processed. Order status is ${order.status}`
      })
    }

    // Create PayPal payment
    const payment = await paymentService.createPayPalPayment(order, return_url, cancel_url)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Payment initiated successfully',
      result: payment
    })
  } catch (error) {
    console.error('Create PayPal payment error:', error)
    return res.status(error instanceof ErrorWithStatus ? error.status : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to create payment'
    })
  }
}

export const capturePaypalPaymentController = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params
    const { paypal_order_id } = req.body

    if (!paypal_order_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'PayPal order ID is required'
      })
    }

    // Capture the payment
    const result = await paymentService.capturePayPalPayment(paypal_order_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Payment captured successfully',
      result
    })
  } catch (error) {
    console.error('Capture PayPal payment error:', error)
    return res.status(error instanceof ErrorWithStatus ? error.status : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to capture payment'
    })
  }
}

export const getPaymentStatusController = async (req: Request, res: Response) => {
  try {
    const { payment_id } = req.params

    // Get payment details
    const payment = await paymentService.getPaymentById(payment_id)

    if (!payment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Payment not found'
      })
    }

    // Check if payment belongs to the authenticated user
    const { user_id, role } = req.decode_authorization as TokenPayload

    const order = await orderService.getOrderById(payment.order_id.toString())

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Order for this payment not found'
      })
    }

    const isBuyer = order.buyer_id.toString() === user_id
    const isSeller =
      role === 'seller' &&
      order.items.some((item: { seller_id: { toString: () => string } }) => item.seller_id.toString() === user_id)
    const isAdmin = role === 'admin'

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'You are not authorized to view this payment'
      })
    }

    // For PayPal payments, verify current status
    if (payment.provider === PaymentProvider.PAYPAL) {
      const paypalStatus = await paymentService.verifyPayPalPayment(payment.provider_order_id)

      // Return combined information
      return res.status(HTTP_STATUS.OK).json({
        message: 'Payment status retrieved successfully',
        result: {
          ...payment,
          current_provider_status: paypalStatus.status
        }
      })
    }

    // For other payment providers
    return res.status(HTTP_STATUS.OK).json({
      message: 'Payment status retrieved successfully',
      result: payment
    })
  } catch (error) {
    console.error('Get payment status error:', error)
    return res.status(error instanceof ErrorWithStatus ? error.status : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to get payment status'
    })
  }
}

export const getOrderPaymentsController = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params

    // Get order details to check authorization
    const order = await orderService.getOrderById(order_id)

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Order not found'
      })
    }

    // Check if user is authorized to view order payments
    const { user_id, role } = req.decode_authorization as TokenPayload

    const isBuyer = order.buyer_id.toString() === user_id
    const isSeller =
      role === 'seller' &&
      order.items.some((item: { seller_id: { toString: () => string } }) => item.seller_id.toString() === user_id)
    const isAdmin = role === 'admin'

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'You are not authorized to view payments for this order'
      })
    }

    // Get all payments for the order
    const payments = await paymentService.getPaymentsForOrder(order_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Order payments retrieved successfully',
      result: payments
    })
  } catch (error) {
    console.error('Get order payments error:', error)
    return res.status(error instanceof ErrorWithStatus ? error.status : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to get order payments'
    })
  }
}

export const refundPaymentController = async (req: Request, res: Response) => {
  try {
    const { payment_id } = req.params
    const { amount, reason } = req.body
    const { role } = req.decode_authorization as TokenPayload

    // Only admin or seller can issue refunds
    if (role !== 'admin' && role !== 'seller') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'You are not authorized to issue refunds'
      })
    }

    // Get payment details
    const payment = await paymentService.getPaymentById(payment_id)

    if (!payment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Payment not found'
      })
    }

    // If a seller is refunding, ensure they are refunding their own sale
    if (role === 'seller') {
      const { user_id } = req.decode_authorization as TokenPayload
      const order = await orderService.getOrderById(payment.order_id.toString())

      if (!order) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Order for this payment not found'
        })
      }

      const isSellerProduct = order.items.some(
        (item: { seller_id: { toString: () => string } }) => item.seller_id.toString() === user_id
      )

      if (!isSellerProduct) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: 'You can only refund payments for your own products'
        })
      }
    }

    // Process the refund based on the payment provider
    if (payment.provider === PaymentProvider.PAYPAL) {
      const result = await paymentService.refundPayPalPayment(payment_id, amount, reason)

      return res.status(HTTP_STATUS.OK).json({
        message: 'Payment refunded successfully',
        result
      })
    } else {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `Refunds for ${payment.provider} payments are not implemented`
      })
    }
  } catch (error) {
    console.error('Refund payment error:', error)
    return res.status(error instanceof ErrorWithStatus ? error.status : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to refund payment'
    })
  }
}

export const paypalWebhookController = async (req: Request, res: Response) => {
  try {
    // Process the webhook data
    await paymentService.processPayPalWebhook(req.body)

    // Always return 200 to PayPal to acknowledge receipt
    return res.status(HTTP_STATUS.OK).json({
      message: 'Webhook received successfully'
    })
  } catch (error) {
    console.error('PayPal webhook error:', error)

    // Log the error but still return 200 to PayPal
    // This prevents PayPal from retrying the webhook unnecessarily
    return res.status(HTTP_STATUS.OK).json({
      message: 'Webhook received with errors'
    })
  }
}
