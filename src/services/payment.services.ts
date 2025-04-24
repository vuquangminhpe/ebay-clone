import axios from 'axios'
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { envConfig } from '../constants/config'
import { OrderStatus } from '../constants/enums'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

// PayPal API endpoints - use sandbox for development and production for live
const PAYPAL_API_BASE =
  process.env.NODE_ENV === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

// Payment types and statuses
export enum PaymentProvider {
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  CREDIT_CARD = 'credit_card',
  COD = 'cash_on_delivery'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled'
}

// Interfaces for payment data
interface PaymentData {
  order_id: string
  amount: number
  currency: string
  provider: PaymentProvider
  return_url: string
  cancel_url: string
  metadata?: Record<string, any>
}

interface PayPalOrderItem {
  name: string
  unit_amount: {
    currency_code: string
    value: string
  }
  quantity: string
  description?: string
  sku?: string
  category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS'
}

class PaymentService {
  // Generate PayPal access token
  private async getPayPalAccessToken(): Promise<string> {
    try {
      const client_id = process.env.PAYPAL_CLIENT_ID
      const client_secret = process.env.PAYPAL_CLIENT_SECRET

      if (!client_id || !client_secret) {
        throw new ErrorWithStatus({
          message: 'PayPal credentials not configured',
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR
        })
      }

      const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64')

      const response = await axios.post(`${PAYPAL_API_BASE}/v1/oauth2/token`, 'grant_type=client_credentials', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`
        }
      })

      return response.data.access_token
    } catch (error) {
      console.error('Error getting PayPal access token:', error)
      throw new ErrorWithStatus({
        message: 'Failed to authenticate with PayPal',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  // Create PayPal payment for an order
  async createPayPalPayment(order: any, returnUrl: string, cancelUrl: string) {
    try {
      // Get access token
      const accessToken = await this.getPayPalAccessToken()

      // Format order items for PayPal
      const items: PayPalOrderItem[] = order.items.map((item: any) => ({
        name: item.product_name.substring(0, 127), // PayPal limits name to 127 chars
        unit_amount: {
          currency_code: 'USD', // Hardcoded for simplicity, could be dynamic
          value: item.price.toFixed(2)
        },
        quantity: item.quantity.toString(),
        description: `Order #${order.order_number}`,
        category: 'PHYSICAL_GOODS'
      }))

      // Calculate amounts
      const itemTotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0).toFixed(2)

      // Create request payload
      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: order.order_number,
            description: `Purchase from eBay Clone - Order #${order.order_number}`,
            amount: {
              currency_code: 'USD',
              value: order.total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: itemTotal
                },
                shipping: {
                  currency_code: 'USD',
                  value: order.shipping.toFixed(2)
                },
                tax_total: {
                  currency_code: 'USD',
                  value: order.tax.toFixed(2)
                },
                discount: {
                  currency_code: 'USD',
                  value: order.discount.toFixed(2)
                }
              }
            },
            items
          }
        ],
        application_context: {
          brand_name: 'eBay Clone',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
          shipping_preference: 'SET_PROVIDED_ADDRESS'
        }
      }

      // Make API request to PayPal to create order
      const response = await axios.post(`${PAYPAL_API_BASE}/v2/checkout/orders`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      })

      // Save payment record in database
      const payment = {
        _id: new ObjectId(),
        order_id: new ObjectId(order._id as string),
        provider_order_id: response.data.id,
        provider: PaymentProvider.PAYPAL,
        amount: order.total,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        details: response.data,
        created_at: new Date(),
        updated_at: new Date()
      }

      await databaseService.db.collection('payments').insertOne(payment)

      // Return relevant information for frontend
      return {
        payment_id: payment._id,
        provider_order_id: response.data.id,
        status: PaymentStatus.PENDING,
        approval_url: response.data.links.find((link: any) => link.rel === 'approve').href,
        provider: PaymentProvider.PAYPAL
      }
    } catch (error) {
      console.error('Error creating PayPal payment:', error)
      throw new ErrorWithStatus({
        message: 'Failed to process payment with PayPal',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  // Capture PayPal payment after user approval
  async capturePayPalPayment(orderId: string) {
    try {
      // Get access token
      const accessToken = await this.getPayPalAccessToken()

      // Capture the payment
      const response = await axios.post(
        `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      // Find payment in database
      const payment = await databaseService.db.collection('payments').findOne({
        provider_order_id: orderId
      })

      if (!payment) {
        throw new ErrorWithStatus({
          message: 'Payment record not found',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      // Update payment status in database
      const paymentStatus = response.data.status === 'COMPLETED' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING

      await databaseService.db.collection('payments').updateOne(
        { provider_order_id: orderId },
        {
          $set: {
            status: paymentStatus,
            capture_details: response.data,
            updated_at: new Date()
          }
        }
      )

      // If payment is completed, update order status
      if (paymentStatus === PaymentStatus.COMPLETED) {
        await databaseService.orders.updateOne(
          { _id: payment.order_id },
          {
            $set: {
              status: OrderStatus.PAID as any,
              payment_status: true,
              payment_details: {
                provider: PaymentProvider.PAYPAL,
                transaction_id: response.data.id,
                payment_time: new Date()
              },
              updated_at: new Date()
            }
          }
        )
      }

      return {
        payment_id: payment._id,
        order_id: payment.order_id,
        status: paymentStatus,
        provider: PaymentProvider.PAYPAL,
        details: response.data
      }
    } catch (error) {
      console.error('Error capturing PayPal payment:', error)
      throw new ErrorWithStatus({
        message: 'Failed to capture payment with PayPal',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  // Process refund for a PayPal payment
  async refundPayPalPayment(paymentId: string, amount?: number, reason?: string) {
    try {
      // Find payment in database
      const payment = await databaseService.db.collection('payments').findOne({
        _id: new ObjectId(paymentId)
      })

      if (!payment) {
        throw new ErrorWithStatus({
          message: 'Payment record not found',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new ErrorWithStatus({
          message: 'Only completed payments can be refunded',
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      // Get capture ID from payment details
      const captureId = payment.capture_details.purchase_units[0].payments.captures[0].id

      // Get access token
      const accessToken = await this.getPayPalAccessToken()

      // Prepare refund data
      const refundData: any = {}

      // Add amount if partial refund
      if (amount) {
        refundData.amount = {
          value: amount.toFixed(2),
          currency_code: payment.currency || 'USD'
        }
      }

      // Add note to refund if provided
      if (reason) {
        refundData.note_to_payer = reason.substring(0, 255) // PayPal limits to 255 chars
      }

      // Process refund
      const response = await axios.post(`${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`, refundData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      })

      // Determine if this is a full or partial refund
      const isFullRefund = !amount || amount >= payment.amount

      // Update payment status in database
      await databaseService.db.collection('payments').updateOne(
        { _id: new ObjectId(paymentId) },
        {
          $set: {
            status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
            refund_details: response.data,
            refunded_amount: amount || payment.amount,
            refund_reason: reason,
            updated_at: new Date()
          }
        }
      )

      // Update order status if it's a full refund
      if (isFullRefund) {
        await databaseService.orders.updateOne(
          { _id: payment.order_id },
          {
            $set: {
              status: OrderStatus.REFUNDED as any,
              refund_details: {
                amount: amount || payment.amount,
                reason,
                refund_date: new Date()
              },
              updated_at: new Date()
            }
          }
        )
      }

      return {
        payment_id: payment._id,
        order_id: payment.order_id,
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refunded_amount: amount || payment.amount,
        provider: PaymentProvider.PAYPAL,
        details: response.data
      }
    } catch (error) {
      console.error('Error refunding PayPal payment:', error)
      throw new ErrorWithStatus({
        message: 'Failed to process refund with PayPal',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  // Verify payment status with PayPal
  async verifyPayPalPayment(orderId: string) {
    try {
      // Get access token
      const accessToken = await this.getPayPalAccessToken()

      // Get order details
      const response = await axios.get(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      })

      return {
        provider_order_id: orderId,
        status: response.data.status,
        details: response.data
      }
    } catch (error) {
      console.error('Error verifying PayPal payment:', error)
      throw new ErrorWithStatus({
        message: 'Failed to verify payment with PayPal',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  // Process payment webhook from PayPal
  async processPayPalWebhook(event: any) {
    try {
      // Verify webhook event signature (in a real implementation)
      // ...

      // Extract event type and data
      const eventType = event.event_type
      const resource = event.resource

      // Process different event types
      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          // Payment completed successfully
          await this.handlePaymentCompleted(resource)
          break

        case 'PAYMENT.CAPTURE.DENIED':
        case 'PAYMENT.CAPTURE.DECLINED':
        case 'PAYMENT.CAPTURE.FAILED':
          // Payment failed
          await this.handlePaymentFailed(resource)
          break

        case 'PAYMENT.CAPTURE.REFUNDED':
          // Payment refunded
          await this.handlePaymentRefunded(resource)
          break

        default:
          // Other event types
          console.log(`Unhandled PayPal webhook event: ${eventType}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Error processing PayPal webhook:', error)
      throw new ErrorWithStatus({
        message: 'Failed to process PayPal webhook',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  // Handle completed payment webhook
  private async handlePaymentCompleted(resource: any) {
    // Find the payment by PayPal's ID
    const payment = await databaseService.db.collection('payments').findOne({
      'capture_details.id': resource.id
    })

    if (!payment) {
      console.error('Payment not found for completed webhook:', resource.id)
      return
    }

    // Update payment status
    await databaseService.db.collection('payments').updateOne(
      { _id: payment._id },
      {
        $set: {
          status: PaymentStatus.COMPLETED,
          webhook_details: resource,
          updated_at: new Date()
        }
      }
    )

    // Update order status
    await databaseService.orders.updateOne(
      { _id: payment.order_id },
      {
        $set: {
          status: OrderStatus.PAID as any,
          payment_status: true,
          updated_at: new Date()
        }
      }
    )
  }

  // Handle failed payment webhook
  private async handlePaymentFailed(resource: any) {
    // Find the payment by PayPal's ID
    const payment = await databaseService.db.collection('payments').findOne({
      'capture_details.id': resource.id
    })

    if (!payment) {
      console.error('Payment not found for failed webhook:', resource.id)
      return
    }

    // Update payment status
    await databaseService.db.collection('payments').updateOne(
      { _id: payment._id },
      {
        $set: {
          status: PaymentStatus.FAILED,
          webhook_details: resource,
          updated_at: new Date()
        }
      }
    )

    // Update order status
    await databaseService.orders.updateOne(
      { _id: payment.order_id },
      {
        $set: {
          status: OrderStatus.PENDING as any,
          payment_status: false,
          updated_at: new Date()
        }
      }
    )
  }

  // Handle refunded payment webhook
  private async handlePaymentRefunded(resource: any) {
    // Find the payment by PayPal's ID
    const payment = await databaseService.db.collection('payments').findOne({
      'capture_details.id': resource.id
    })

    if (!payment) {
      console.error('Payment not found for refund webhook:', resource.id)
      return
    }

    // Check if it's a full or partial refund
    const refundAmount = parseFloat(resource.amount.value)
    const isFullRefund = refundAmount >= payment.amount

    // Update payment status
    await databaseService.db.collection('payments').updateOne(
      { _id: payment._id },
      {
        $set: {
          status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
          refund_details: resource,
          refunded_amount: refundAmount,
          updated_at: new Date()
        }
      }
    )

    // Update order status if full refund
    if (isFullRefund) {
      await databaseService.orders.updateOne(
        { _id: payment.order_id },
        {
          $set: {
            status: OrderStatus.REFUNDED as any,
            updated_at: new Date()
          }
        }
      )
    }
  }

  // Get payment by ID
  async getPaymentById(paymentId: string) {
    return databaseService.db.collection('payments').findOne({
      _id: new ObjectId(paymentId)
    })
  }

  // Get payments for an order
  async getPaymentsForOrder(orderId: string) {
    return databaseService.db
      .collection('payments')
      .find({
        order_id: new ObjectId(orderId)
      })
      .toArray()
  }
}

const paymentService = new PaymentService()
export default paymentService
