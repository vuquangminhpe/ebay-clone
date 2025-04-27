// src/controllers/payment.controllers.ts
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import paymentService from '../services/payment.services'
import { PaymentMethodTypes } from '../models/schemas/PaymentMethod.schema'
import { PaymentProvider, TransactionStatus, TransactionTypes } from '../models/schemas/Transaction.schema'

// Define request body interfaces
interface AddPaymentMethodReqBody {
  type: PaymentMethodTypes
  details: any
  set_default?: boolean
}

interface CreatePaypalOrderReqBody {
  amount: number
  currency?: string
  description?: string
}

interface CapturePaypalPaymentReqBody {
  order_id: string
}

// Define request params interface
interface PaymentMethodParams extends ParamsDictionary {
  payment_method_id: string
}

export const addPaymentMethodController = async (
  req: Request<ParamsDictionary, any, AddPaymentMethodReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { type, details, set_default } = req.body

  try {
    const result = await paymentService.addPaymentMethod({
      user_id,
      type,
      details,
      set_default
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Payment method added successfully',
      result
    })
  } catch (error) {
    console.error('Add payment method error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to add payment method'
    })
  }
}

export const getUserPaymentMethodsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  try {
    const paymentMethods = await paymentService.getUserPaymentMethods(user_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Payment methods retrieved successfully',
      result: paymentMethods
    })
  } catch (error) {
    console.error('Get payment methods error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get payment methods'
    })
  }
}

export const setDefaultPaymentMethodController = async (req: Request<PaymentMethodParams>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { payment_method_id } = req.params

  try {
    const result = await paymentService.setDefaultPaymentMethod(user_id, payment_method_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Default payment method set successfully',
      result
    })
  } catch (error) {
    console.error('Set default payment method error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to set default payment method'
    })
  }
}

export const deletePaymentMethodController = async (req: Request<PaymentMethodParams>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { payment_method_id } = req.params

  try {
    await paymentService.deletePaymentMethod(user_id, payment_method_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Payment method deleted successfully'
    })
  } catch (error) {
    console.error('Delete payment method error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to delete payment method'
    })
  }
}

export const createPaypalOrderController = async (
  req: Request<ParamsDictionary, any, CreatePaypalOrderReqBody>,
  res: Response
) => {
  const { amount, currency, description } = req.body

  try {
    const paypalOrder = await paymentService.createPaypalOrder(amount, currency, description)

    return res.status(HTTP_STATUS.OK).json({
      message: 'PayPal order created successfully',
      result: paypalOrder
    })
  } catch (error) {
    console.error('Create PayPal order error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to create PayPal order'
    })
  }
}

export const capturePaypalPaymentController = async (
  req: Request<ParamsDictionary, any, CapturePaypalPaymentReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { order_id } = req.body

  try {
    // Capture the payment
    const captureData = await paymentService.capturePaypalPayment(order_id)

    // Create transaction record
    const transaction = await paymentService.createTransaction({
      user_id,
      amount: parseFloat(captureData.purchase_units[0].amount.value),
      type: TransactionTypes.PAYMENT,
      provider: PaymentProvider.PAYPAL,
      provider_transaction_id: captureData.id,
      provider_fee: captureData.purchase_units[0].payments.captures[0].seller_receivable_breakdown?.paypal_fee?.value
        ? parseFloat(captureData.purchase_units[0].payments.captures[0].seller_receivable_breakdown.paypal_fee.value)
        : undefined,
      metadata: captureData
    })

    // Update transaction status
    await paymentService.updateTransactionStatus(transaction._id.toString(), TransactionStatus.COMPLETED)

    return res.status(HTTP_STATUS.OK).json({
      message: 'PayPal payment captured successfully',
      result: {
        capture_details: captureData,
        transaction
      }
    })
  } catch (error) {
    console.error('Capture PayPal payment error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to capture PayPal payment'
    })
  }
}

export const getUserTransactionsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { type, status, page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    const result = await paymentService.getUserTransactions(user_id, {
      type: type as TransactionTypes,
      status: status as TransactionStatus,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'User transactions retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get user transactions error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get user transactions'
    })
  }
}

export const getSellerTransactionsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { type, status, page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    const result = await paymentService.getSellerTransactions(user_id, {
      type: type as TransactionTypes,
      status: status as TransactionStatus,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Seller transactions retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get seller transactions error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get seller transactions'
    })
  }
}
