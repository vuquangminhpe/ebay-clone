import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import ReturnRequest, { ReturnReason, ReturnStatus } from '../models/schemas/ReturnRequest.schema'
import orderService from './orders.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { OrderStatus } from '../constants/enums'

class ReturnRequestService {
  async createReturnRequest({
    order_id,
    user_id,
    product_id,
    reason,
    details,
    images
  }: {
    order_id: string
    user_id: string
    product_id: string
    reason: ReturnReason
    details: string
    images?: string[]
  }) {
    // Check if order exists and belongs to user
    const order = await orderService.getOrderById(order_id)

    if (!order) {
      throw new ErrorWithStatus({
        message: 'Order not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (order.buyer_id.toString() !== user_id) {
      throw new ErrorWithStatus({
        message: 'You are not authorized to create a return for this order',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Check if order status is eligible for return
    if (order.status !== (OrderStatus.DELIVERED as any)) {
      throw new ErrorWithStatus({
        message: 'Only delivered orders can be returned',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if product is in the order
    const orderItem = order.items.find((item: any) => item.product_id.toString() === product_id)

    if (!orderItem) {
      throw new ErrorWithStatus({
        message: 'Product not found in this order',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if a return request already exists for this order and product
    const existingRequest = await databaseService.returnRequests.findOne({
      order_id: new ObjectId(order_id),
      product_id: new ObjectId(product_id)
    })

    if (existingRequest) {
      throw new ErrorWithStatus({
        message: 'A return request already exists for this product',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Create return request
    const returnRequest = new ReturnRequest({
      order_id: new ObjectId(order_id),
      user_id: new ObjectId(user_id),
      product_id: new ObjectId(product_id),
      reason,
      details,
      status: ReturnStatus.PENDING,
      images
    })

    const result = await databaseService.returnRequests.insertOne(returnRequest)

    return { ...returnRequest, _id: result.insertedId }
  }

  async getReturnRequestById(return_id: string) {
    return databaseService.returnRequests.findOne({ _id: new ObjectId(return_id) })
  }

  async updateReturnRequestStatus(
    return_id: string,
    {
      status,
      seller_response,
      refund_amount
    }: {
      status: ReturnStatus
      seller_response?: string
      refund_amount?: number
    }
  ) {
    const updateData: any = {
      status,
      updated_at: new Date()
    }

    if (seller_response !== undefined) updateData.seller_response = seller_response
    if (refund_amount !== undefined) updateData.refund_amount = refund_amount

    // If status is completed, add completed_at timestamp
    if (status === ReturnStatus.COMPLETED) {
      updateData.completed_at = new Date()
    }

    await databaseService.returnRequests.updateOne({ _id: new ObjectId(return_id) }, { $set: updateData })

    return this.getReturnRequestById(return_id)
  }

  async getBuyerReturnRequests(
    user_id: string,
    {
      status,
      limit = 10,
      page = 1,
      sort = 'created_at',
      order = 'desc'
    }: {
      status?: ReturnStatus
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

    if (status) {
      filter.status = status
    }

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.returnRequests.countDocuments(filter)

    // Get return requests
    const returnRequests = await databaseService.returnRequests
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get order and product details for each return request
    const enrichedRequests = await Promise.all(
      returnRequests.map(async (request) => {
        const [order, product] = await Promise.all([
          orderService.getOrderById(request.order_id.toString()),
          databaseService.products.findOne({ _id: request.product_id }, { projection: { name: 1, medias: 1 } })
        ])

        // Find the specific item in the order
        const orderItem = order?.items.find((item: any) => item.product_id.toString() === request.product_id.toString())

        return {
          ...request,
          order: order
            ? {
                order_number: order.order_number,
                status: order.status
              }
            : null,
          product: product
            ? {
                name: product.name,
                image: product.medias?.find((m: any) => m.is_primary)?.url || product.medias?.[0]?.url || ''
              }
            : null,
          item_details: orderItem
            ? {
                price: orderItem.price,
                quantity: orderItem.quantity
              }
            : null
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      return_requests: enrichedRequests,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async getSellerReturnRequests(
    seller_id: string,
    {
      status,
      limit = 10,
      page = 1,
      sort = 'created_at',
      order = 'desc'
    }: {
      status?: ReturnStatus
      limit?: number
      page?: number
      sort?: string
      order?: 'asc' | 'desc'
    } = {}
  ) {
    const skip = (page - 1) * limit

    // Find all orders with items sold by this seller
    const orders = await databaseService.orders
      .find({ 'items.seller_id': new ObjectId(seller_id) })
      .project({ _id: 1 })
      .toArray()

    const orderIds = orders.map((order) => order._id)

    // Build filter
    const filter: any = {
      order_id: { $in: orderIds }
    }

    if (status) {
      filter.status = status
    }

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.returnRequests.countDocuments(filter)

    // Get return requests
    const returnRequests = await databaseService.returnRequests
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Filter to only include return requests for items sold by this seller
    const sellerReturnRequests = []

    for (const request of returnRequests) {
      const order = await orderService.getOrderById(request.order_id.toString())
      const orderItem = order?.items.find(
        (item: any) =>
          item.product_id.toString() === request.product_id.toString() && item.seller_id.toString() === seller_id
      )

      if (orderItem) {
        sellerReturnRequests.push(request)
      }
    }

    // Get buyer and product details for each return request
    const enrichedRequests = await Promise.all(
      sellerReturnRequests.map(async (request) => {
        const [buyer, product, order] = await Promise.all([
          databaseService.users.findOne({ _id: request.user_id }, { projection: { name: 1, username: 1, avatar: 1 } }),
          databaseService.products.findOne({ _id: request.product_id }, { projection: { name: 1, medias: 1 } }),
          orderService.getOrderById(request.order_id.toString())
        ])

        // Find the specific item in the order
        const orderItem = order?.items.find((item: any) => item.product_id.toString() === request.product_id.toString())

        return {
          ...request,
          buyer: buyer
            ? {
                _id: buyer._id,
                name: buyer.name,
                username: buyer.username,
                avatar: buyer.avatar
              }
            : null,
          order: order
            ? {
                order_number: order.order_number,
                status: order.status,
                created_at: order.created_at
              }
            : null,
          product: product
            ? {
                name: product.name,
                image: product.medias?.find((m: any) => m.is_primary)?.url || product.medias?.[0]?.url || ''
              }
            : null,
          item_details: orderItem
            ? {
                price: orderItem.price,
                quantity: orderItem.quantity
              }
            : null
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(sellerReturnRequests.length / limit)

    return {
      return_requests: enrichedRequests,
      pagination: {
        total: sellerReturnRequests.length,
        page,
        limit,
        totalPages
      }
    }
  }
}

const returnRequestService = new ReturnRequestService()
export default returnRequestService
