import { ObjectId } from 'mongodb'

export enum FeedbackTypes {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

interface FeedbackType {
  _id?: ObjectId
  seller_id: ObjectId
  buyer_id: ObjectId
  order_id: ObjectId
  rating: number
  type: FeedbackTypes
  comment: string
  reply?: string
  is_public: boolean
  created_at?: Date
  updated_at?: Date
  replied_at?: Date
}

export default class Feedback {
  _id?: ObjectId
  seller_id: ObjectId
  buyer_id: ObjectId
  order_id: ObjectId
  rating: number
  type: FeedbackTypes
  comment: string
  reply?: string
  is_public: boolean
  created_at: Date
  updated_at: Date
  replied_at?: Date

  constructor({
    _id,
    seller_id,
    buyer_id,
    order_id,
    rating,
    type,
    comment,
    reply,
    is_public,
    created_at,
    updated_at,
    replied_at
  }: FeedbackType) {
    const date = new Date()
    this._id = _id
    this.seller_id = seller_id
    this.buyer_id = buyer_id
    this.order_id = order_id
    this.rating = rating
    this.type = type
    this.comment = comment
    this.reply = reply
    this.is_public = is_public
    this.created_at = created_at || date
    this.updated_at = updated_at || date
    this.replied_at = replied_at
  }
}
