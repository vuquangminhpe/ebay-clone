import { ParamsDictionary, Query } from 'express-serve-static-core'
import { OrderStatus, PaymentMethod } from '../schemas/Order.schema'

export interface CreateOrderReqBody {
  shipping_address_id: string
  payment_method: PaymentMethod
  coupon_code?: string
  notes?: string
}

export interface UpdateOrderReqBody {
  status?: OrderStatus
  tracking_number?: string
  notes?: string
}

export interface OrderParams extends ParamsDictionary {
  order_id: string
}

export interface OrderQuery extends Query {
  page?: string
  limit?: string
  sort?: string
  order?: 'asc' | 'desc'
  status?: string
  date_from?: string
  date_to?: string
  seller_id?: string
}

export interface CancelOrderReqBody {
  reason?: string
}

export interface PayOrderReqBody {
  payment_method: PaymentMethod
  payment_details?: Record<string, any>
}

export interface ShipOrderReqBody {
  tracking_number: string
  shipping_provider?: string
  estimated_delivery_date?: string
}

export interface DeliverOrderReqBody {
  delivery_notes?: string
}
