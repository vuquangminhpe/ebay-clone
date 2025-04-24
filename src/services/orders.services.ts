import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Order, { OrderItem, OrderStatus, PaymentMethod } from '../models/schemas/Order.schema'
import { CartItem } from '../models/schemas/Cart.schema'
import productService from './product.services'
import couponService from './coupon.services'

class OrderService {
  async createOrder({
    buyer_id,
    items,
    shipping_address_id,
    payment_method,
    coupon_code,
    notes
  }: {
    buyer_id: ObjectId
    items: (CartItem & {
      product_name?: string
      product_image?: string
      available?: boolean
      in_stock?: boolean
      current_price?: number
    })[]
    shipping_address_id: ObjectId
    payment_method: PaymentMethod
    coupon_code?: string
    notes?: string
  }) {
    // Filter only selected items that are available and in stock
    const selectedItems = items.filter((item) => item.selected && item.available && item.in_stock)

    if (selectedItems.length === 0) {
      throw new Error('No valid items to order')
    }

    // Transform cart items to order items
    const orderItems: OrderItem[] = await Promise.all(
      selectedItems.map(async (item) => {
        // Get product details
        const product = await productService.getProductById(item.product_id.toString())

        if (!product) {
          throw new Error('Product not found')
        }

        // Decrease product stock
        await productService.decreaseProductStock(
          item.product_id.toString(),
          item.quantity,
          item.variant_id?.toString()
        )

        return {
          product_id: item.product_id,
          product_name: product.name,
          product_image: product.medias.find((m) => m.is_primary)?.url || product.medias[0]?.url || '',
          quantity: item.quantity,
          price: item.price,
          variant: item.variant_id
            ? product.variants?.find((v) => v._id?.toString() === item.variant_id?.toString())?.attributes
            : undefined,
          seller_id: product.seller_id
        }
      })
    )

    // Calculate order totals
    let subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    let shipping = 5 // Default shipping cost

    // Check if all products have free shipping
    const allFreeShipping = await this.checkAllFreeShipping(orderItems.map((item) => item.product_id))
    if (allFreeShipping) {
      shipping = 0
    }

    // Calculate tax (simplified)
    const taxRate = 0.1 // 10%
    const tax = subtotal * taxRate

    // Apply coupon if exists
    let discount = 0
    if (coupon_code) {
      discount = await this.calculateCouponDiscount(coupon_code, subtotal, orderItems)

      // Increment coupon usage count
      if (discount > 0) {
        await couponService.incrementUsageCount(coupon_code)
      }
    }

    // Calculate total
    const total = subtotal + shipping + tax - discount

    // Create order
    const order = new Order({
      buyer_id,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      coupon_code: discount > 0 ? coupon_code : undefined,
      shipping_address_id,
      payment_method,
      payment_status: payment_method === PaymentMethod.COD, // Mark as paid for COD
      status: payment_method === PaymentMethod.COD ? OrderStatus.PAID : OrderStatus.PENDING,
      notes
    })

    const result = await databaseService.orders.insertOne(order)

    return { ...order, _id: result.insertedId }
  }

  private async checkAllFreeShipping(productIds: ObjectId[]) {
    const products = await productService.getProductsByIds(productIds)
    return products.every((product) => product.free_shipping)
  }

  private async calculateCouponDiscount(coupon_code: string, subtotal: number, orderItems: OrderItem[]) {
    const coupon = await couponService.getCouponByCode(coupon_code)

    if (!coupon || !coupon.is_active) {
      return 0
    }

    // Check if coupon is expired
    const now = new Date()
    if (now < coupon.starts_at || now > coupon.expires_at) {
      return 0
    }

    // Check if coupon has reached usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return 0
    }

    // Check min purchase requirement
    if (coupon.min_purchase && subtotal < coupon.min_purchase) {
      return 0
    }

    // Check coupon applicability
    let discountableSubtotal = subtotal

    if (coupon.applicability !== 'all_products') {
      if (coupon.applicability === 'specific_products' && coupon.product_ids) {
        // Calculate subtotal of only the specific products
        discountableSubtotal = orderItems
          .filter((item) => coupon.product_ids?.some((pid) => pid.toString() === item.product_id.toString()))
          .reduce((sum, item) => sum + item.price * item.quantity, 0)
      } else if (coupon.applicability === 'specific_categories' && coupon.category_ids) {
        // Get product details for all items
        const productIds = orderItems.map((item) => item.product_id)
        const products = await productService.getProductsByIds(productIds)

        // Calculate subtotal of only products in the specific categories
        discountableSubtotal = orderItems
          .filter((item) => {
            const product = products.find((p) => p._id.toString() === item.product_id.toString())
            return product && coupon.category_ids?.some((cid) => cid.toString() === product.category_id.toString())
          })
          .reduce((sum, item) => sum + item.price * item.quantity, 0)
      }

      if (discountableSubtotal === 0) {
        return 0
      }
    }

    // Calculate discount based on coupon type
    let discount = 0
    if (coupon.type === 'percentage') {
      discount = discountableSubtotal * (coupon.value / 100)

      // Apply max discount if specified
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount
      }
    } else {
      // fixed amount
      discount = coupon.value

      // Don't exceed discountable subtotal
      if (discount > discountableSubtotal) {
        discount = discountableSubtotal
      }
    }

    return discount
  }

  async getOrderById(order_id: string) {
    return databaseService.orders.findOne({ _id: new ObjectId(order_id) })
  }

  async updateOrderStatus(order_id: string, status: OrderStatus, additionalUpdates: any = {}) {
    const updateData = {
      status,
      updated_at: new Date(),
      ...additionalUpdates
    }

    // If status is DELIVERED, add delivery date
    if (status === OrderStatus.DELIVERED) {
      updateData.delivered_at = new Date()
    }

    await databaseService.orders.updateOne({ _id: new ObjectId(order_id) }, { $set: updateData })

    return this.getOrderById(order_id)
  }

  async getOrders({
    filter,
    limit = 10,
    page = 1,
    sort = 'created_at',
    order = 'desc'
  }: {
    filter: any
    limit: number
    page: number
    sort?: string
    order?: 'asc' | 'desc'
  }) {
    const skip = (page - 1) * limit

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.orders.countDocuments(filter)

    // Get orders
    const orders = await databaseService.orders.find(filter).sort(sortOption).skip(skip).limit(limit).toArray()

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async getSellerOrders({
    seller_id,
    status,
    date_from,
    date_to,
    limit = 10,
    page = 1,
    sort = 'created_at',
    order = 'desc'
  }: {
    seller_id: string
    status?: OrderStatus
    date_from?: Date
    date_to?: Date
    limit: number
    page: number
    sort?: string
    order?: 'asc' | 'desc'
  }) {
    const filter: any = {
      'items.seller_id': new ObjectId(seller_id)
    }

    if (status) {
      filter.status = status
    }

    if (date_from || date_to) {
      filter.created_at = {}
      if (date_from) {
        filter.created_at.$gte = date_from
      }
      if (date_to) {
        filter.created_at.$lte = date_to
      }
    }

    return this.getOrders({
      filter,
      limit,
      page,
      sort,
      order
    })
  }

  async getBuyerOrders(
    buyer_id: string,
    options: {
      status?: OrderStatus
      limit?: number
      page?: number
    } = {}
  ) {
    const { status, limit = 10, page = 1 } = options

    const filter: any = {
      buyer_id: new ObjectId(buyer_id)
    }

    if (status) {
      filter.status = status
    }

    return this.getOrders({
      filter,
      limit,
      page,
      sort: 'created_at',
      order: 'desc'
    })
  }

  async getOrdersByDateRange(start_date: Date, end_date: Date) {
    return databaseService.orders
      .find({
        created_at: {
          $gte: start_date,
          $lte: end_date
        }
      })
      .toArray()
  }

  async getRevenueStats(start_date: Date, end_date: Date) {
    const pipeline = [
      {
        $match: {
          created_at: {
            $gte: start_date,
            $lte: end_date
          },
          status: { $in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] }
        }
      },
      {
        $group: {
          _id: null,
          total_revenue: { $sum: '$total' },
          total_orders: { $sum: 1 },
          average_order_value: { $avg: '$total' }
        }
      }
    ]

    const result = await databaseService.orders.aggregate(pipeline).toArray()

    return (
      result[0] || {
        total_revenue: 0,
        total_orders: 0,
        average_order_value: 0
      }
    )
  }

  async getSellerRevenueStats(seller_id: string, start_date: Date, end_date: Date) {
    // For sellers, we need to calculate revenue based on their items in orders
    const pipeline = [
      {
        $match: {
          created_at: {
            $gte: start_date,
            $lte: end_date
          },
          status: { $in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          'items.seller_id': new ObjectId(seller_id)
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.seller_id': new ObjectId(seller_id)
        }
      },
      {
        $group: {
          _id: null,
          total_revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          total_orders: { $sum: 1 },
          total_items_sold: { $sum: '$items.quantity' }
        }
      }
    ]

    const result = await databaseService.orders.aggregate(pipeline).toArray()

    return (
      result[0] || {
        total_revenue: 0,
        total_orders: 0,
        total_items_sold: 0
      }
    )
  }
}

const orderService = new OrderService()
export default orderService
