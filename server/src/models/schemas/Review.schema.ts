import { ObjectId } from 'mongodb'

interface ReviewType {
  _id?: ObjectId
  product_id: ObjectId
  order_id: ObjectId
  user_id: ObjectId
  seller_id: ObjectId
  rating: number
  comment: string
  images?: string[]
  created_at?: Date
  updated_at?: Date
}

export default class Review {
  _id?: ObjectId
  product_id: ObjectId
  order_id: ObjectId
  user_id: ObjectId
  seller_id: ObjectId
  rating: number
  comment: string
  images?: string[]
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    product_id,
    order_id,
    user_id,
    seller_id,
    rating,
    comment,
    images,
    created_at,
    updated_at
  }: ReviewType) {
    const date = new Date()
    this._id = _id
    this.product_id = product_id
    this.order_id = order_id
    this.user_id = user_id
    this.seller_id = seller_id
    this.rating = rating
    this.comment = comment
    this.images = images || []
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
