import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { ORDER_MESSAGE, CART_MESSAGE } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import {
  CreateOrderReqBody,
  OrderParams,
  OrderQuery,
  UpdateOrderReqBody,
  CancelOrderReqBody,
  PayOrderReqBody,
  ShipOrderReqBody,
  DeliverOrderReqBody
} from '../models/request/Order.request'
import orderService from '../services/orders.services'
import cartService from '../services/carts.services'
import addressService from '../services/address.services'
import { OrderStatus, PaymentMethod } from '../constants/enums'
import { UserRole } from '../models/schemas/User.schema'
import { ErrorWithStatus } from '~/models/Errors'

export const createOrderController = async (req: Request<ParamsDictionary, any, CreateOrderReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { shipping_address_id, payment_method, coupon_code, notes } = req.body

  // Validate address exists and belongs to user
  const address = await addressService.getAddressById(shipping_address_id)
  if (!address || address.user_id.toString() !== user_id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: ORDER_MESSAGE.SHIPPING_ADDRESS_REQUIRED
    })
  }

  // Get cart with selected items
  const cart = await cartService.getCart(user_id)
  if (!cart) {
    throw new ErrorWithStatus({
      message: CART_MESSAGE.CART_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  const selectedItems = (cart.items as any).filter((item: { selected: any }) => item.selected)

  if (selectedItems.length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: CART_MESSAGE.CART_IS_EMPTY
    })
  }

  // Create order from cart items
  const result = await orderService.createOrder({
    buyer_id: new ObjectId(user_id),
    items: selectedItems,
    shipping_address_id: new ObjectId(shipping_address_id),
    payment_method,
    coupon_code,
    notes
  })

  // Remove ordered items from cart
  await cartService.removeOrderedItems(
    user_id,
    selectedItems.map((item: { product_id: { toString: () => any } }) => item.product_id.toString())
  )

  return res.status(HTTP_STATUS.CREATED).json({
    message: ORDER_MESSAGE.CREATE_ORDER_SUCCESS,
    result
  })
}

export const getOrderController = async (req: Request<OrderParams>, res: Response) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { order_id } = req.params

  const order = await orderService.getOrderById(order_id)

  if (!order) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: ORDER_MESSAGE.ORDER_NOT_FOUND
    })
  }

  // Only buyer, seller of items in order, or admin can view order
  const isBuyer = order.buyer_id.toString() === user_id
  const isSeller = order.items.some(
    (item: { seller_id: { toString: () => string } }) => item.seller_id.toString() === user_id
  )
  const isAdmin = role === UserRole.ADMIN

  if (!isBuyer && !isSeller && !isAdmin) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: ORDER_MESSAGE.UNAUTHORIZED_ORDER_ACCESS
    })
  }

  return res.status(HTTP_STATUS.OK).json({
    message: ORDER_MESSAGE.GET_ORDER_SUCCESS,
    result: order
  })
}

export const getBuyerOrdersController = async (req: Request<ParamsDictionary, any, any, OrderQuery>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { page = '1', limit = '10', status, date_from, date_to, sort = 'created_at', order = 'desc' } = req.query

  // Build filter for buyer's orders
  const filter: any = {
    buyer_id: new ObjectId(user_id)
  }

  if (status) {
    filter.status = status
  }

  if (date_from || date_to) {
    filter.created_at = {}
    if (date_from) {
      filter.created_at.$gte = new Date(date_from)
    }
    if (date_to) {
      filter.created_at.$lte = new Date(date_to)
    }
  }

  const result = await orderService.getOrders({
    filter,
    limit: parseInt(limit),
    page: parseInt(page),
    sort,
    order: order as 'asc' | 'desc'
  })

  return res.status(HTTP_STATUS.OK).json({
    message: ORDER_MESSAGE.GET_ORDERS_SUCCESS,
    result
  })
}

export const getSellerOrdersController = async (
  req: Request<ParamsDictionary, any, any, OrderQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { page = '1', limit = '10', status, date_from, date_to, sort = 'created_at', order = 'desc' } = req.query

  // For sellers, we need to get orders where any item has their seller_id
  const result = await orderService.getSellerOrders({
    seller_id: user_id,
    status: status as any,
    date_from: date_from ? new Date(date_from) : undefined,
    date_to: date_to ? new Date(date_to) : undefined,
    limit: parseInt(limit),
    page: parseInt(page),
    sort,
    order: order as 'asc' | 'desc'
  })

  return res.status(HTTP_STATUS.OK).json({
    message: ORDER_MESSAGE.GET_ORDERS_SUCCESS,
    result
  })
}

export const cancelOrderController = async (req: Request<OrderParams, any, CancelOrderReqBody>, res: Response) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { order_id } = req.params
  const { reason } = req.body

  const order = await orderService.getOrderById(order_id)

  if (!order) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: ORDER_MESSAGE.ORDER_NOT_FOUND
    })
  }

  // Only buyer, seller, or admin can cancel an order
  const isBuyer = order.buyer_id.toString() === user_id
  const isSeller = order.items.some(
    (item: { seller_id: { toString: () => string } }) => item.seller_id.toString() === user_id
  )
  const isAdmin = role === UserRole.ADMIN

  if (!isBuyer && !isSeller && !isAdmin) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: ORDER_MESSAGE.UNAUTHORIZED_ORDER_ACCESS
    })
  }

  // Check if order can be cancelled
  if (
    order.status === OrderStatus.SHIPPED ||
    order.status === OrderStatus.DELIVERED ||
    order.status === OrderStatus.CANCELLED
  ) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: ORDER_MESSAGE.CANNOT_CANCEL_SHIPPED_ORDER
    })
  }

  // Cancel order
  await orderService.updateOrderStatus(order_id, OrderStatus.CANCELLED as any, {
    notes: reason || `Cancelled by ${isBuyer ? 'buyer' : isSeller ? 'seller' : 'admin'}`
  })

  return res.status(HTTP_STATUS.OK).json({
    message: ORDER_MESSAGE.ORDER_CANCELLED
  })
}

export const payOrderController = async (req: Request<OrderParams, any, PayOrderReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { order_id } = req.params
  const { payment_method, payment_details } = req.body

  const order = await orderService.getOrderById(order_id)

  if (!order) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: ORDER_MESSAGE.ORDER_NOT_FOUND
    })
  }

  // Only buyer can pay for an order
  if (order.buyer_id.toString() !== user_id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: ORDER_MESSAGE.UNAUTHORIZED_ORDER_ACCESS
    })
  }

  // Check if order is in PENDING status
  if (order.status !== OrderStatus.PENDING) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: ORDER_MESSAGE.ORDER_ALREADY_PAID
    })
  }

  // Process payment (simulated)
  let paymentResult = true
  let paymentError = null

  // If payment method is PayPal, perform payment logic
  if (payment_method === PaymentMethod.PAYPAL) {
    // Simulated PayPal integration
    // In a real application, this would integrate with PayPal API
    if (payment_details && payment_details.paypal_token) {
      // Process PayPal payment
      // paymentResult = await paypalService.processPayment(...)
    } else {
      paymentResult = false
      paymentError = 'Invalid PayPal payment details'
    }
  }

  if (!paymentResult) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: ORDER_MESSAGE.PAYMENT_FAILED,
      error: paymentError
    })
  }

  // Update order status to PAID
  await orderService.updateOrderStatus(order_id, OrderStatus.PAID as any, {
    payment_status: true,
    payment_method
  })

  return res.status(HTTP_STATUS.OK).json({
    message: ORDER_MESSAGE.PAYMENT_SUCCESS
  })
}

export const shipOrderController = async (req: Request<OrderParams, any, ShipOrderReqBody>, res: Response) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { order_id } = req.params
  const { tracking_number, shipping_provider, estimated_delivery_date } = req.body

  const order = await orderService.getOrderById(order_id)

  if (!order) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: ORDER_MESSAGE.ORDER_NOT_FOUND
    })
  }

  // Only seller of items in order or admin can ship an order
  const isSeller = order.items.some(
    (item: { seller_id: { toString: () => string } }) => item.seller_id.toString() === user_id
  )
  const isAdmin = role === UserRole.ADMIN

  if (!isSeller && !isAdmin) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: ORDER_MESSAGE.UNAUTHORIZED_ORDER_ACCESS
    })
  }

  // Check if order is in PAID status
  if (order.status !== OrderStatus.PAID) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: `Order must be in PAID status to ship. Current status: ${order.status}`
    })
  }

  // Update order status to SHIPPED
  await orderService.updateOrderStatus(order_id, OrderStatus.SHIPPED as any, {
    tracking_number,
    notes: `Shipped by ${shipping_provider || 'seller'}. ${estimated_delivery_date ? `Estimated delivery: ${estimated_delivery_date}` : ''}`
  })

  return res.status(HTTP_STATUS.OK).json({
    message: ORDER_MESSAGE.ORDER_STATUS_UPDATED
  })
}

export const deliverOrderController = async (req: Request<OrderParams, any, DeliverOrderReqBody>, res: Response) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { order_id } = req.params
  const { delivery_notes } = req.body

  const order = await orderService.getOrderById(order_id)

  if (!order) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: ORDER_MESSAGE.ORDER_NOT_FOUND
    })
  }

  // Both buyer, seller, or admin can mark as delivered
  const isBuyer = order.buyer_id.toString() === user_id
  const isSeller = order.items.some(
    (item: { seller_id: { toString: () => string } }) => item.seller_id.toString() === user_id
  )
  const isAdmin = role === UserRole.ADMIN

  if (!isBuyer && !isSeller && !isAdmin) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: ORDER_MESSAGE.UNAUTHORIZED_ORDER_ACCESS
    })
  }

  // Check if order is in SHIPPED status
  if (order.status !== OrderStatus.SHIPPED) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: `Order must be in SHIPPED status to mark as delivered. Current status: ${order.status}`
    })
  }

  // Update order status to DELIVERED
  await orderService.updateOrderStatus(order_id, OrderStatus.DELIVERED as any, {
    notes: delivery_notes || `Marked as delivered by ${isBuyer ? 'buyer' : isSeller ? 'seller' : 'admin'}`
  })

  return res.status(HTTP_STATUS.OK).json({
    message: ORDER_MESSAGE.ORDER_STATUS_UPDATED
  })
}

export const getOrdersForAdminController = async (
  req: Request<ParamsDictionary, any, any, OrderQuery>,
  res: Response
) => {
  const { role } = req.decode_authorization as TokenPayload

  // Only admin can access this endpoint
  if (role !== UserRole.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: 'Admin permission required'
    })
  }

  const {
    page = '1',
    limit = '20',
    status,
    date_from,
    date_to,
    sort = 'created_at',
    order = 'desc',
    seller_id
  } = req.query

  // Build filter
  const filter: any = {}

  if (status) {
    filter.status = status
  }

  if (date_from || date_to) {
    filter.created_at = {}
    if (date_from) {
      filter.created_at.$gte = new Date(date_from)
    }
    if (date_to) {
      filter.created_at.$lte = new Date(date_to)
    }
  }

  if (seller_id) {
    filter['items.seller_id'] = new ObjectId(seller_id)
  }

  const result = await orderService.getOrders({
    filter,
    limit: parseInt(limit),
    page: parseInt(page),
    sort,
    order: order as 'asc' | 'desc'
  })

  return res.status(HTTP_STATUS.OK).json({
    message: ORDER_MESSAGE.GET_ORDERS_SUCCESS,
    result
  })
}
