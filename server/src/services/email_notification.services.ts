import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import { ObjectId } from 'mongodb'
import { envConfig } from '../constants/config'
import { OrderStatus } from '../constants/enums'
import databaseService from './database.services'
import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'

// Initialize SES client
const sesClient = new SESClient({
  region: envConfig.region as string,
  credentials: {
    secretAccessKey: envConfig.secretAccessKey as string,
    accessKeyId: envConfig.accessKeyId as string
  }
})

class NotificationService {
  private templates: Record<string, HandlebarsTemplateDelegate> = {}

  constructor() {
    // Load email templates
    this.loadTemplates()
  }

  private loadTemplates() {
    const templateDir = path.join(__dirname, '../templates')

    try {
      // Order related templates
      this.templates.orderCreated = this.compileTemplate(path.join(templateDir, 'order-created.html'))
      this.templates.orderPaid = this.compileTemplate(path.join(templateDir, 'order-paid.html'))
      this.templates.orderShipped = this.compileTemplate(path.join(templateDir, 'order-shipped.html'))
      this.templates.orderDelivered = this.compileTemplate(path.join(templateDir, 'order-delivered.html'))
      this.templates.orderCancelled = this.compileTemplate(path.join(templateDir, 'order-cancelled.html'))

      // Seller notification templates
      this.templates.newOrder = this.compileTemplate(path.join(templateDir, 'new-order-seller.html'))
      this.templates.itemSold = this.compileTemplate(path.join(templateDir, 'item-sold.html'))

      // Review templates
      this.templates.newReview = this.compileTemplate(path.join(templateDir, 'new-review.html'))

      // Message templates
      this.templates.newMessage = this.compileTemplate(path.join(templateDir, 'new-message.html'))

      // Discount templates
      this.templates.priceDropAlert = this.compileTemplate(path.join(templateDir, 'price-drop-alert.html'))
      this.templates.couponAlert = this.compileTemplate(path.join(templateDir, 'coupon-alert.html'))
    } catch (error) {
      console.error('Error loading email templates:', error)
    }
  }

  private compileTemplate(templatePath: string): HandlebarsTemplateDelegate {
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      return Handlebars.compile(templateContent)
    } catch (error) {
      console.error(`Error compiling template at ${templatePath}:`, error)
      // Return a simple fallback template in case of error
      return Handlebars.compile('<p>{{message}}</p>')
    }
  }

  // Generic email sending function
  private async sendEmail({
    toAddress,
    subject,
    body,
    ccAddresses = [],
    replyToAddresses = []
  }: {
    toAddress: string | string[]
    subject: string
    body: string
    ccAddresses?: string | string[]
    replyToAddresses?: string | string[]
  }) {
    try {
      const fromAddress = envConfig.fromAddress as string

      if (!fromAddress) {
        throw new Error('Sender email address not configured')
      }

      const toAddresses = Array.isArray(toAddress) ? toAddress : [toAddress]
      const ccArray = Array.isArray(ccAddresses) ? ccAddresses : ccAddresses ? [ccAddresses] : []
      const replyToArray = Array.isArray(replyToAddresses)
        ? replyToAddresses
        : replyToAddresses
          ? [replyToAddresses]
          : []

      const sendEmailCommand = new SendEmailCommand({
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: ccArray
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: body
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject
          }
        },
        Source: fromAddress,
        ReplyToAddresses: replyToArray
      })

      return sesClient.send(sendEmailCommand)
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  // Send notification for order status change
  async sendOrderStatusUpdateEmail(orderId: string, status: OrderStatus) {
    try {
      // Get order details
      const order = await databaseService.orders.findOne({ _id: new ObjectId(orderId) })

      if (!order) {
        throw new Error(`Order not found: ${orderId}`)
      }

      // Get buyer details
      const buyer = await databaseService.users.findOne({ _id: order.buyer_id })

      if (!buyer || !buyer.email) {
        throw new Error(`Buyer email not found for order: ${orderId}`)
      }

      // Determine which template to use based on order status
      let templateName: string
      let subject: string

      switch (status) {
        case OrderStatus.PENDING:
          templateName = 'orderCreated'
          subject = `Order Confirmation #${order.order_number}`
          break
        case OrderStatus.PAID:
          templateName = 'orderPaid'
          subject = `Payment Received for Order #${order.order_number}`
          break
        case OrderStatus.SHIPPED:
          templateName = 'orderShipped'
          subject = `Your Order #${order.order_number} Has Been Shipped`
          break
        case OrderStatus.DELIVERED:
          templateName = 'orderDelivered'
          subject = `Your Order #${order.order_number} Has Been Delivered`
          break
        case OrderStatus.CANCELLED:
          templateName = 'orderCancelled'
          subject = `Order #${order.order_number} Has Been Cancelled`
          break
        default:
          templateName = 'orderCreated'
          subject = `Order #${order.order_number} Status Update`
      }

      // Prepare template data
      const templateData = {
        buyer_name: buyer.name,
        order_number: order.order_number,
        order_date: new Date(order.created_at).toLocaleDateString(),
        order_status: status,
        order_total: `$${order.total.toFixed(2)}`,
        tracking_number: order.tracking_number || 'N/A',
        items: order.items.map((item: any) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          price: `$${item.price.toFixed(2)}`,
          subtotal: `$${(item.price * item.quantity).toFixed(2)}`
        })),
        subtotal: `$${order.subtotal.toFixed(2)}`,
        shipping: `$${order.shipping.toFixed(2)}`,
        tax: `$${order.tax.toFixed(2)}`,
        discount: order.discount ? `$${order.discount.toFixed(2)}` : '$0.00',
        total: `$${order.total.toFixed(2)}`,
        shipping_address: order.shipping || 'No shipping address provided',
        payment_method: order.payment_method,
        order_link: `${envConfig.client_url}/orders/${orderId}`,
        shop_link: envConfig.client_url,
        current_year: new Date().getFullYear()
      }

      // Generate email content using template
      const template = this.templates[templateName]
      if (!template) {
        throw new Error(`Email template not found: ${templateName}`)
      }

      const emailContent = template(templateData)

      // Send email to buyer
      await this.sendEmail({
        toAddress: buyer.email,
        subject,
        body: emailContent
      })

      // Log the notification
      await databaseService.db.collection('email_logs').insertOne({
        user_id: buyer._id,
        order_id: order._id,
        type: 'order_status_update',
        status,
        sent_at: new Date()
      })

      return true
    } catch (error) {
      console.error('Error sending order status update email:', error)
      return false
    }
  }

  // Notify seller of new order
  async notifySellerOfNewOrder(orderId: string) {
    try {
      // Get order details
      const order = await databaseService.orders.findOne({ _id: new ObjectId(orderId) })

      if (!order) {
        throw new Error(`Order not found: ${orderId}`)
      }

      // Group items by seller
      const sellerItems: Record<string, any[]> = {}

      for (const item of order.items) {
        const sellerId = item.seller_id.toString()

        if (!sellerItems[sellerId]) {
          sellerItems[sellerId] = []
        }

        sellerItems[sellerId].push(item)
      }

      // Notify each seller about their items
      for (const [sellerId, items] of Object.entries(sellerItems)) {
        // Get seller details
        const seller = await databaseService.users.findOne({ _id: new ObjectId(sellerId) })

        if (!seller || !seller.email) {
          console.error(`Seller email not found for ID: ${sellerId}`)
          continue
        }

        // Calculate total for this seller's items
        const sellerTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const buyer_name = await databaseService.users.findOne({ _id: order.buyer_id })
        // Prepare template data
        const templateData = {
          seller_name: seller.name,
          order_number: order.order_number,
          order_date: new Date(order.created_at).toLocaleDateString(),
          buyer_name: buyer_name || 'Customer',
          items: items.map((item) => ({
            product_name: item.product_name,
            quantity: item.quantity,
            price: `$${item.price.toFixed(2)}`,
            subtotal: `$${(item.price * item.quantity).toFixed(2)}`
          })),
          seller_total: `$${sellerTotal.toFixed(2)}`,
          order_link: `${envConfig.client_url}/seller/orders/${orderId}`,
          shop_link: `${envConfig.client_url}/seller/dashboard`,
          current_year: new Date().getFullYear()
        }

        // Generate email content using template
        const template = this.templates.newOrder
        if (!template) {
          throw new Error('New order email template not found')
        }

        const emailContent = template(templateData)

        // Send email to seller
        await this.sendEmail({
          toAddress: seller.email,
          subject: `New Order #${order.order_number}`,
          body: emailContent
        })

        // Log the notification
        await databaseService.db.collection('email_logs').insertOne({
          user_id: seller._id,
          order_id: order._id,
          type: 'new_order_seller',
          sent_at: new Date()
        })
      }

      return true
    } catch (error) {
      console.error('Error notifying sellers of new order:', error)
      return false
    }
  }

  // Notify about new product review
  async sendNewReviewNotification(reviewId: string) {
    try {
      // Get review details
      const review = await databaseService.reviews.findOne({ _id: new ObjectId(reviewId) })

      if (!review) {
        throw new Error(`Review not found: ${reviewId}`)
      }

      // Get product details
      const product = await databaseService.products.findOne({ _id: review.product_id })

      if (!product) {
        throw new Error(`Product not found for review: ${reviewId}`)
      }

      // Get seller details
      const seller = await databaseService.users.findOne({ _id: product.seller_id })

      if (!seller || !seller.email) {
        throw new Error(`Seller email not found for product: ${product._id}`)
      }

      // Get reviewer details
      const reviewer = await databaseService.users.findOne({ _id: review.user_id })

      // Prepare template data
      const templateData = {
        seller_name: seller.name,
        product_name: product.name,
        product_id: product._id.toString(),
        review_id: reviewId,
        reviewer_name: reviewer ? reviewer.name : 'A customer',
        rating: review.rating,
        comment: review.comment,
        review_date: new Date(review.created_at).toLocaleDateString(),
        product_link: `${envConfig.client_url}/products/${product._id}`,
        product_reviews_link: `${envConfig.client_url}/products/${product._id}/reviews`,
        shop_link: `${envConfig.client_url}/seller/dashboard`,
        current_year: new Date().getFullYear()
      }

      // Generate email content using template
      const template = this.templates.newReview
      if (!template) {
        throw new Error('New review email template not found')
      }

      const emailContent = template(templateData)

      // Send email to seller
      await this.sendEmail({
        toAddress: seller.email,
        subject: `New Review for Your Product: ${product.name}`,
        body: emailContent
      })

      // Log the notification
      await databaseService.db.collection('email_logs').insertOne({
        user_id: seller._id,
        product_id: product._id,
        review_id: review._id,
        type: 'new_review',
        sent_at: new Date()
      })

      return true
    } catch (error) {
      console.error('Error sending new review notification:', error)
      return false
    }
  }

  // Notify about new message
  async sendNewMessageNotification(
    conversationId: string,
    senderId: string,
    receiverId: string,
    messagePreview: string
  ) {
    try {
      // Get receiver details
      const receiver = await databaseService.users.findOne({ _id: new ObjectId(receiverId) })

      if (!receiver || !receiver.email) {
        throw new Error(`Receiver email not found: ${receiverId}`)
      }

      // Get sender details
      const sender = await databaseService.users.findOne({ _id: new ObjectId(senderId) })

      if (!sender) {
        throw new Error(`Sender not found: ${senderId}`)
      }

      // Prepare template data
      const templateData = {
        receiver_name: receiver.name,
        sender_name: sender.name,
        message_preview: messagePreview.length > 100 ? messagePreview.substring(0, 97) + '...' : messagePreview,
        conversation_link: `${envConfig.client_url}/messages/${conversationId}`,
        current_year: new Date().getFullYear()
      }

      // Generate email content using template
      const template = this.templates.newMessage
      if (!template) {
        throw new Error('New message email template not found')
      }

      const emailContent = template(templateData)

      // Send email to receiver
      await this.sendEmail({
        toAddress: receiver.email,
        subject: `New Message from ${sender.name}`,
        body: emailContent
      })

      // Log the notification
      await databaseService.db.collection('email_logs').insertOne({
        user_id: receiver._id,
        sender_id: sender._id,
        conversation_id: new ObjectId(conversationId),
        type: 'new_message',
        sent_at: new Date()
      })

      return true
    } catch (error) {
      console.error('Error sending new message notification:', error)
      return false
    }
  }

  // Notify about price drop
  async sendPriceDropNotification(productId: string, oldPrice: number, newPrice: number) {
    try {
      // Get product details
      const product = await databaseService.products.findOne({ _id: new ObjectId(productId) })

      if (!product) {
        throw new Error(`Product not found: ${productId}`)
      }

      // Get users who viewed this product (in a real system, we'd have product view tracking)
      // For now, let's simulate by getting users who have this product in their cart
      const cartsWithProduct = await databaseService.carts
        .find({
          'items.product_id': new ObjectId(productId)
        })
        .toArray()

      if (cartsWithProduct.length === 0) {
        console.log(`No users found with product ${productId} in cart`)
        return true
      }

      // Get unique user IDs
      const userIds = [...new Set(cartsWithProduct.map((cart) => cart.user_id.toString()))]

      // Get user details
      const users = await databaseService.users
        .find({
          _id: { $in: userIds.map((id) => new ObjectId(id)) }
        })
        .toArray()

      // Calculate price drop percentage
      const discountPercent = Math.round((1 - newPrice / oldPrice) * 100)

      // Prepare and send emails to each user
      for (const user of users) {
        if (!user.email) continue

        // Prepare template data
        const templateData = {
          user_name: user.name,
          product_name: product.name,
          old_price: `$${oldPrice.toFixed(2)}`,
          new_price: `$${newPrice.toFixed(2)}`,
          discount_percent: `${discountPercent}%`,
          product_image: product.medias.find((m: any) => m.is_primary)?.url || '',
          product_link: `${envConfig.client_url}/products/${productId}`,
          shop_link: envConfig.client_url,
          current_year: new Date().getFullYear()
        }

        // Generate email content using template
        const template = this.templates.priceDropAlert
        if (!template) {
          throw new Error('Price drop alert email template not found')
        }

        const emailContent = template(templateData)

        // Send email to user
        await this.sendEmail({
          toAddress: user.email,
          subject: `Price Drop Alert: ${product.name} now ${discountPercent}% off!`,
          body: emailContent
        })

        // Log the notification
        await databaseService.db.collection('email_logs').insertOne({
          user_id: user._id,
          product_id: product._id,
          type: 'price_drop_alert',
          old_price: oldPrice,
          new_price: newPrice,
          discount_percent: discountPercent,
          sent_at: new Date()
        })
      }

      return true
    } catch (error) {
      console.error('Error sending price drop notifications:', error)
      return false
    }
  }

  // Notify about new coupon
  async sendCouponNotification(couponId: string, userIds: string[] = []) {
    try {
      // Get coupon details
      const coupon = await databaseService.coupons.findOne({ _id: new ObjectId(couponId) })

      if (!coupon) {
        throw new Error(`Coupon not found: ${couponId}`)
      }

      // If specific users are provided, notify only those users
      // Otherwise, notify all users (or a segment based on business rules)
      let usersToNotify = []

      if (userIds.length > 0) {
        usersToNotify = await databaseService.users
          .find({
            _id: { $in: userIds.map((id) => new ObjectId(id)) }
          })
          .toArray()
      } else {
        // For example, notify users who have made a purchase in the last 30 days
        // This logic would be customized based on the application's needs
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentOrders = await databaseService.orders
          .find({
            created_at: { $gte: thirtyDaysAgo }
          })
          .toArray()

        const recentBuyerIds = [...new Set(recentOrders.map((order) => order.buyer_id.toString()))]

        usersToNotify = await databaseService.users
          .find({
            _id: { $in: recentBuyerIds.map((id) => new ObjectId(id)) }
          })
          .toArray()
      }

      // Format discount value
      const discountValue = coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`

      // Prepare and send emails to each user
      for (const user of usersToNotify) {
        if (!user.email) continue

        // Prepare template data
        const templateData = {
          user_name: user.name,
          coupon_code: coupon.code,
          discount_value: discountValue,
          coupon_description: coupon.description,
          min_purchase: coupon.min_purchase ? `$${coupon.min_purchase.toFixed(2)}` : 'No minimum',
          expiry_date: new Date(coupon.expires_at).toLocaleDateString(),
          shop_link: `${envConfig.client_url}?coupon=${coupon.code}`,
          current_year: new Date().getFullYear()
        }

        // Generate email content using template
        const template = this.templates.couponAlert
        if (!template) {
          throw new Error('Coupon alert email template not found')
        }

        const emailContent = template(templateData)

        // Send email to user
        await this.sendEmail({
          toAddress: user.email,
          subject: `Special Offer: ${discountValue} Off Your Next Purchase!`,
          body: emailContent
        })

        // Log the notification
        await databaseService.db.collection('email_logs').insertOne({
          user_id: user._id,
          coupon_id: coupon._id,
          type: 'coupon_alert',
          sent_at: new Date()
        })
      }

      return true
    } catch (error) {
      console.error('Error sending coupon notifications:', error)
      return false
    }
  }
}

const notificationService = new NotificationService()
export default notificationService
