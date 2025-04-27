/* eslint-disable @typescript-eslint/no-explicit-any */
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  COD = 'cod' // Cash on delivery
}

export interface OrderItem {
  product_id: string
  product_name: string
  product_image: string
  quantity: number
  price: number
  variant?: Record<string, string>
  seller_id: string
}

export interface Order {
  _id: string
  order_number: string
  buyer_id: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  coupon_code?: string
  shipping_address_id: string
  payment_method: PaymentMethod
  payment_status: boolean
  status: OrderStatus
  tracking_number?: string
  notes?: string
  delivered_at?: string
  created_at: string
  updated_at: string
}

export interface OrderList {
  orders: Order[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CreateOrderRequest {
  shipping_address_id: string
  payment_method: PaymentMethod
  coupon_code?: string
  notes?: string
}

export interface CancelOrderRequest {
  reason?: string
}

export interface PayOrderRequest {
  payment_method: PaymentMethod
  payment_details?: any
}

export interface ShipOrderRequest {
  tracking_number?: string
  shipping_provider?: string
  estimated_delivery_date?: string
}

export interface DeliverOrderRequest {
  delivery_notes?: string
}
