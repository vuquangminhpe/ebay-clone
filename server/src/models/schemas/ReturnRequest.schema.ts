import { ObjectId } from 'mongodb'

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ReturnReason {
  DAMAGED = 'damaged',
  INCORRECT_ITEM = 'incorrect_item',
  DEFECTIVE = 'defective',
  NOT_AS_DESCRIBED = 'not_as_described',
  CHANGED_MIND = 'changed_mind',
  OTHER = 'other'
}

interface ReturnRequestType {
  _id?: ObjectId
  order_id: ObjectId
  user_id: ObjectId
  product_id: ObjectId
  reason: ReturnReason
  details: string
  status: ReturnStatus
  seller_response?: string
  refund_amount?: number
  images?: string[]
  created_at?: Date
  updated_at?: Date
  completed_at?: Date
}

export default class ReturnRequest {
  _id?: ObjectId
  order_id: ObjectId
  user_id: ObjectId
  product_id: ObjectId
  reason: ReturnReason
  details: string
  status: ReturnStatus
  seller_response?: string
  refund_amount?: number
  images?: string[]
  created_at: Date
  updated_at: Date
  completed_at?: Date

  constructor({
    _id,
    order_id,
    user_id,
    product_id,
    reason,
    details,
    status,
    seller_response,
    refund_amount,
    images,
    created_at,
    updated_at,
    completed_at
  }: ReturnRequestType) {
    const date = new Date()
    this._id = _id
    this.order_id = order_id
    this.user_id = user_id
    this.product_id = product_id
    this.reason = reason
    this.details = details
    this.status = status || ReturnStatus.PENDING
    this.seller_response = seller_response
    this.refund_amount = refund_amount
    this.images = images || []
    this.created_at = created_at || date
    this.updated_at = updated_at || date
    this.completed_at = completed_at
  }
}
