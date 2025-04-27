import { ObjectId } from 'mongodb'

export enum ShipmentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned'
}

interface ShipmentType {
  _id?: ObjectId
  order_id: ObjectId
  shipping_method_id: ObjectId
  tracking_number?: string
  carrier?: string
  status: ShipmentStatus
  estimated_delivery_date?: Date
  actual_delivery_date?: Date
  shipping_label_url?: string
  weight_kg?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: string
  }
  tracking_history?: {
    status: string
    location?: string
    timestamp: Date
    description?: string
  }[]
  shipping_cost: number
  created_at?: Date
  updated_at?: Date
  shipped_at?: Date
}

export default class Shipment {
  _id?: ObjectId
  order_id: ObjectId
  shipping_method_id: ObjectId
  tracking_number?: string
  carrier?: string
  status: ShipmentStatus
  estimated_delivery_date?: Date
  actual_delivery_date?: Date
  shipping_label_url?: string
  weight_kg?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: string
  }
  tracking_history: {
    status: string
    location?: string
    timestamp: Date
    description?: string
  }[]
  shipping_cost: number
  created_at: Date
  updated_at: Date
  shipped_at?: Date

  constructor({
    _id,
    order_id,
    shipping_method_id,
    tracking_number,
    carrier,
    status,
    estimated_delivery_date,
    actual_delivery_date,
    shipping_label_url,
    weight_kg,
    dimensions,
    tracking_history,
    shipping_cost,
    created_at,
    updated_at,
    shipped_at
  }: ShipmentType) {
    const date = new Date()
    this._id = _id
    this.order_id = order_id
    this.shipping_method_id = shipping_method_id
    this.tracking_number = tracking_number
    this.carrier = carrier
    this.status = status || ShipmentStatus.PENDING
    this.estimated_delivery_date = estimated_delivery_date
    this.actual_delivery_date = actual_delivery_date
    this.shipping_label_url = shipping_label_url
    this.weight_kg = weight_kg
    this.dimensions = dimensions
    this.tracking_history = tracking_history || []
    this.shipping_cost = shipping_cost
    this.created_at = created_at || date
    this.updated_at = updated_at || date
    this.shipped_at = shipped_at
  }
}
