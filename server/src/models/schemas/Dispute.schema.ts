import { ObjectId } from 'mongodb'

export enum DisputeStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED_BUYER = 'resolved_buyer',
  RESOLVED_SELLER = 'resolved_seller',
  CLOSED = 'closed'
}

export enum DisputeReason {
  ITEM_NOT_RECEIVED = 'item_not_received',
  ITEM_NOT_AS_DESCRIBED = 'item_not_as_described',
  DAMAGED_ITEM = 'damaged_item',
  WRONG_ITEM = 'wrong_item',
  RETURN_REQUEST = 'return_request',
  OTHER = 'other'
}

interface DisputeMessage {
  user_id: ObjectId
  user_type: 'buyer' | 'seller' | 'admin'
  message: string
  images?: string[]
  created_at: Date
}

interface DisputeType {
  _id?: ObjectId
  order_id: ObjectId
  product_id?: ObjectId
  buyer_id: ObjectId
  seller_id: ObjectId
  reason: DisputeReason
  description: string
  images?: string[]
  status: DisputeStatus
  messages: DisputeMessage[]
  resolution?: string
  admin_notes?: string
  admin_id?: ObjectId
  created_at?: Date
  updated_at?: Date
  resolved_at?: Date
}

export default class Dispute {
  _id?: ObjectId
  order_id: ObjectId
  product_id?: ObjectId
  buyer_id: ObjectId
  seller_id: ObjectId
  reason: DisputeReason
  description: string
  images?: string[]
  status: DisputeStatus
  messages: DisputeMessage[]
  resolution?: string
  admin_notes?: string
  admin_id?: ObjectId
  created_at: Date
  updated_at: Date
  resolved_at?: Date

  constructor({
    _id,
    order_id,
    product_id,
    buyer_id,
    seller_id,
    reason,
    description,
    images,
    status,
    messages,
    resolution,
    admin_notes,
    admin_id,
    created_at,
    updated_at,
    resolved_at
  }: DisputeType) {
    const date = new Date()
    this._id = _id
    this.order_id = order_id
    this.product_id = product_id
    this.buyer_id = buyer_id
    this.seller_id = seller_id
    this.reason = reason
    this.description = description
    this.images = images || []
    this.status = status
    this.messages = messages || []
    this.resolution = resolution
    this.admin_notes = admin_notes
    this.admin_id = admin_id
    this.created_at = created_at || date
    this.updated_at = updated_at || date
    this.resolved_at = resolved_at
  }
}
