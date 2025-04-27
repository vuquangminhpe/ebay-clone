import {
  Order,
  OrderList,
  CreateOrderRequest,
  CancelOrderRequest,
  PayOrderRequest,
  ShipOrderRequest,
  DeliverOrderRequest
} from '@/types/Order.type'
import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

/**
 * API client for order management
 * Accessible by: Authenticated users only (some endpoints have role restrictions)
 */
export const OrdersApi = {
  /**
   * Create a new order
   * @access Private - Any authenticated user
   */
  createOrder: (params: CreateOrderRequest) =>
    http.post<SuccessResponse<{ message: string; result: Order }>>('/orders', params),

  /**
   * Get order by ID
   * @access Private - Buyer of order, seller of items in order, or admin
   */
  getOrder: (order_id: string) => http.get<SuccessResponse<{ message: string; result: Order }>>(`/orders/${order_id}`),

  /**
   * Get buyer's orders
   * @access Private - Any authenticated user (shows only current user's orders)
   */
  getBuyerOrders: (params?: {
    page?: number
    limit?: number
    status?: string
    date_from?: string
    date_to?: string
    sort?: string
    order?: 'asc' | 'desc'
  }) => http.get<SuccessResponse<{ message: string; result: OrderList }>>('/orders/buyer/me', { params }),

  /**
   * Get seller's orders
   * @access Private - Seller only
   */
  getSellerOrders: (params?: {
    page?: number
    limit?: number
    status?: string
    date_from?: string
    date_to?: string
    sort?: string
    order?: 'asc' | 'desc'
  }) => http.get<SuccessResponse<{ message: string; result: OrderList }>>('/orders/seller/me', { params }),

  /**
   * Cancel an order
   * @access Private - Buyer of order, seller of items in order, or admin
   */
  cancelOrder: (order_id: string, params: CancelOrderRequest) =>
    http.post<SuccessResponse<{ message: string }>>(`/orders/${order_id}/cancel`, params),

  /**
   * Pay for an order
   * @access Private - Buyer of order only
   */
  payOrder: (order_id: string, params: PayOrderRequest) =>
    http.post<SuccessResponse<{ message: string }>>(`/orders/${order_id}/pay`, params),

  /**
   * Mark order as shipped
   * @access Private - Seller of items in order or admin
   */
  shipOrder: (order_id: string, params: ShipOrderRequest) =>
    http.post<SuccessResponse<{ message: string }>>(`/orders/${order_id}/ship`, params),

  /**
   * Mark order as delivered
   * @access Private - Buyer, seller, or admin
   */
  deliverOrder: (order_id: string, params: DeliverOrderRequest) =>
    http.post<SuccessResponse<{ message: string }>>(`/orders/${order_id}/deliver`, params),

  /**
   * Get all orders (admin only)
   * @access Private - Admin only
   */
  getAllOrders: (params?: {
    page?: number
    limit?: number
    status?: string
    date_from?: string
    date_to?: string
    sort?: string
    order?: 'asc' | 'desc'
    seller_id?: string
  }) => http.get<SuccessResponse<{ message: string; result: OrderList }>>('/orders/admin/all', { params })
}
