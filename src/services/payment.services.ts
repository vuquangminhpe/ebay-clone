// src/services/payment.services.ts
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import PaymentMethod, { PaymentMethodStatus, PaymentMethodTypes } from '../models/schemas/PaymentMethod.schema'
import Transaction, { PaymentProvider, TransactionStatus, TransactionTypes } from '../models/schemas/Transaction.schema'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

// PayPal SDK integration (example)
import axios from 'axios'
import { envConfig } from '../constants/config'

class PaymentService {
  private paypalBaseUrl =
    envConfig.paypal_environment === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

  private async getPaypalAccessToken() {
    try {
      const auth = Buffer.from(`${envConfig.paypal_client_id}:${envConfig.paypal_client_secret}`).toString('base64')
      const response = await axios({
        method: 'post',
        url: `${this.paypalBaseUrl}/v1/oauth2/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`
        },
        data: 'grant_type=client_credentials'
      })

      return response.data.access_token
    } catch (error) {
      console.error('PayPal authentication error:', error)
      throw new ErrorWithStatus({
        message: 'Failed to authenticate with PayPal',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  // Payment Method Management
  async addPaymentMethod({
    user_id,
    type,
    details,
    set_default = false
  }: {
    user_id: string
    type: PaymentMethodTypes
    details: any
    set_default?: boolean
  }) {
    // If setting as default, unset any existing default
    if (set_default) {
      await databaseService.paymentMethods.updateMany(
        { user_id: new ObjectId(user_id), is_default: true },
        { $set: { is_default: false, updated_at: new Date() } }
      )
    } else {
      // Check if user has any payment methods
      const existingMethods = await databaseService.paymentMethods.countDocuments({
        user_id: new ObjectId(user_id)
      })

      // If this is the first payment method, make it default
      set_default = existingMethods === 0
    }

    // Create payment method
    const paymentMethod = new PaymentMethod({
      user_id: new ObjectId(user_id),
      type,
      status: PaymentMethodStatus.ACTIVE,
      is_default: set_default,
      details
    })

    const result = await databaseService.paymentMethods.insertOne(paymentMethod)

    return { ...paymentMethod, _id: result.insertedId }
  }

  async getUserPaymentMethods(user_id: string) {
    return databaseService.paymentMethods
      .find({ user_id: new ObjectId(user_id) })
      .sort({ is_default: -1, created_at: -1 })
      .toArray()
  }

  async setDefaultPaymentMethod(user_id: string, payment_method_id: string) {
    // Unset current default
    await databaseService.paymentMethods.updateMany(
      { user_id: new ObjectId(user_id), is_default: true },
      { $set: { is_default: false, updated_at: new Date() } }
    )

    // Set new default
    await databaseService.paymentMethods.updateOne(
      { _id: new ObjectId(payment_method_id), user_id: new ObjectId(user_id) },
      { $set: { is_default: true, updated_at: new Date() } }
    )

    return this.getPaymentMethodById(payment_method_id)
  }

  async getPaymentMethodById(payment_method_id: string) {
    return databaseService.paymentMethods.findOne({ _id: new ObjectId(payment_method_id) })
  }

  async deletePaymentMethod(user_id: string, payment_method_id: string) {
    const paymentMethod = await this.getPaymentMethodById(payment_method_id)

    if (!paymentMethod) {
      throw new ErrorWithStatus({
        message: 'Payment method not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (paymentMethod.user_id.toString() !== user_id) {
      throw new ErrorWithStatus({
        message: 'You do not have permission to delete this payment method',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    await databaseService.paymentMethods.deleteOne({ _id: new ObjectId(payment_method_id) })

    // If deleted was default, set a new default if available
    if (paymentMethod.is_default) {
      const nextPaymentMethod = await databaseService.paymentMethods
        .find({ user_id: new ObjectId(user_id) })
        .sort({ created_at: -1 })
        .limit(1)
        .toArray()

      if (nextPaymentMethod.length > 0) {
        await this.setDefaultPaymentMethod(user_id, nextPaymentMethod[0]._id.toString())
      }
    }

    return { success: true }
  }

  // Payment Processing
  async createPaypalOrder(amount: number, currency: string = 'USD', description: string = 'eBay Clone Purchase') {
    try {
      const accessToken = await this.getPaypalAccessToken()

      const response = await axios({
        method: 'post',
        url: `${this.paypalBaseUrl}/v2/checkout/orders`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        data: {
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount.toFixed(2)
              },
              description
            }
          ]
        }
      })

      return response.data
    } catch (error) {
      console.error('PayPal create order error:', error)
      throw new ErrorWithStatus({
        message: 'Failed to create PayPal order',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  async capturePaypalPayment(order_id: string) {
    try {
      const accessToken = await this.getPaypalAccessToken()

      const response = await axios({
        method: 'post',
        url: `${this.paypalBaseUrl}/v2/checkout/orders/${order_id}/capture`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      })

      return response.data
    } catch (error) {
      console.error('PayPal capture payment error:', error)
      throw new ErrorWithStatus({
        message: 'Failed to capture PayPal payment',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  // Transaction Management
  async createTransaction({
    order_id,
    user_id,
    seller_id,
    amount,
    type,
    payment_method_id,
    provider,
    provider_transaction_id,
    provider_fee,
    notes,
    metadata
  }: {
    order_id?: string
    user_id: string
    seller_id?: string
    amount: number
    type: TransactionTypes
    payment_method_id?: string
    provider: PaymentProvider
    provider_transaction_id?: string
    provider_fee?: number
    notes?: string
    metadata?: any
  }) {
    const transaction = new Transaction({
      order_id: order_id ? new ObjectId(order_id) : undefined,
      user_id: new ObjectId(user_id),
      seller_id: seller_id ? new ObjectId(seller_id) : undefined,
      amount,
      type,
      status: TransactionStatus.PENDING,
      payment_method_id: payment_method_id ? new ObjectId(payment_method_id) : undefined,
      provider,
      provider_transaction_id,
      provider_fee,
      notes,
      metadata
    })

    const result = await databaseService.transactions.insertOne(transaction)

    return { ...transaction, _id: result.insertedId }
  }

  async updateTransactionStatus(transaction_id: string, status: TransactionStatus, provider_transaction_id?: string) {
    const updateData: any = {
      status,
      updated_at: new Date()
    }

    if (provider_transaction_id) {
      updateData.provider_transaction_id = provider_transaction_id
    }

    if (status === TransactionStatus.COMPLETED) {
      updateData.completed_at = new Date()
    }

    await databaseService.transactions.updateOne({ _id: new ObjectId(transaction_id) }, { $set: updateData })

    return this.getTransactionById(transaction_id)
  }

  async getTransactionById(transaction_id: string) {
    return databaseService.transactions.findOne({ _id: new ObjectId(transaction_id) })
  }

  async getUserTransactions(
    user_id: string,
    {
      type,
      status,
      limit = 10,
      page = 1,
      sort = 'created_at',
      order = 'desc'
    }: {
      type?: TransactionTypes
      status?: TransactionStatus
      limit?: number
      page?: number
      sort?: string
      order?: 'asc' | 'desc'
    } = {}
  ) {
    const skip = (page - 1) * limit

    // Build filter
    const filter: any = {
      user_id: new ObjectId(user_id)
    }

    if (type) {
      filter.type = type
    }

    if (status) {
      filter.status = status
    }

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.transactions.countDocuments(filter)

    // Get transactions
    const transactions = await databaseService.transactions
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // For each transaction, get related order details if available
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        if (transaction.order_id) {
          const order = await databaseService.orders.findOne(
            { _id: transaction.order_id },
            { projection: { order_number: 1, status: 1, total_amount: 1 } }
          )

          return {
            ...transaction,
            order: order || null
          }
        }

        return transaction
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      transactions: enrichedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async getSellerTransactions(
    seller_id: string,
    {
      type,
      status,
      limit = 10,
      page = 1,
      sort = 'created_at',
      order = 'desc'
    }: {
      type?: TransactionTypes
      status?: TransactionStatus
      limit?: number
      page?: number
      sort?: string
      order?: 'asc' | 'desc'
    } = {}
  ) {
    const skip = (page - 1) * limit

    // Build filter
    const filter: any = {
      seller_id: new ObjectId(seller_id)
    }

    if (type) {
      filter.type = type
    }

    if (status) {
      filter.status = status
    }

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.transactions.countDocuments(filter)

    // Get transactions
    const transactions = await databaseService.transactions
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // For each transaction, get related order details if available
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        if (transaction.order_id) {
          const order = await databaseService.orders.findOne(
            { _id: transaction.order_id },
            { projection: { order_number: 1, status: 1, total_amount: 1 } }
          )

          const buyer = await databaseService.users.findOne(
            { _id: transaction.user_id },
            { projection: { name: 1, username: 1 } }
          )

          return {
            ...transaction,
            order: order || null,
            buyer: buyer || null
          }
        }

        return {
          ...transaction,
          buyer: null
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      transactions: enrichedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async getOrderTransactions(order_id: string) {
    return databaseService.transactions
      .find({ order_id: new ObjectId(order_id) })
      .sort({ created_at: -1 })
      .toArray()
  }
}

const paymentService = new PaymentService()
export default paymentService
