import { ObjectId } from 'mongodb'

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  PAYPAL = 'paypal',
  COD = 'cod'
}

export interface OrderItem {
  product_id: ObjectId
  product_name: string
  product_image: string
  quantity: number
  price: number
  variant?: Record<string, string>
  seller_id: ObjectId
}

interface OrderType {
  _id?: ObjectId
  order_number?: string
  buyer_id: ObjectId
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  coupon_code?: string
  shipping_address_id: ObjectId
  payment_method: PaymentMethod
  payment_status: boolean
  tracking_number?: string
  status: OrderStatus
  notes?: string
  created_at?: Date
  updated_at?: Date
}

export default class Order {
  _id?: ObjectId
  order_number: string
  buyer_id: ObjectId
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  coupon_code?: string
  shipping_address_id: ObjectId
  payment_method: PaymentMethod
  payment_status: boolean
  tracking_number?: string
  status: OrderStatus
  notes?: string
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    order_number,
    buyer_id,
    items,
    subtotal,
    shipping,
    tax,
    discount,
    total,
    coupon_code,
    shipping_address_id,
    payment_method,
    payment_status,
    tracking_number,
    status,
    notes,
    created_at,
    updated_at
  }: OrderType) {
    const date = new Date()
    this._id = _id
    this.order_number = order_number || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    this.buyer_id = buyer_id
    this.items = items
    this.subtotal = subtotal
    this.shipping = shipping
    this.tax = tax
    this.discount = discount
    this.total = total
    this.coupon_code = coupon_code
    this.shipping_address_id = shipping_address_id
    this.payment_method = payment_method
    this.payment_status = payment_status
    this.tracking_number = tracking_number
    this.status = status
    this.notes = notes
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
