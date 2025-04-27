import { ObjectId } from 'mongodb'

interface BidType {
  _id?: ObjectId
  product_id: ObjectId
  bidder_id: ObjectId
  amount: number
  created_at?: Date
  updated_at?: Date
}

export default class Bid {
  _id?: ObjectId
  product_id: ObjectId
  bidder_id: ObjectId
  amount: number
  created_at: Date
  updated_at: Date

  constructor({ _id, product_id, bidder_id, amount, created_at, updated_at }: BidType) {
    const date = new Date()
    this._id = _id
    this.product_id = product_id
    this.bidder_id = bidder_id
    this.amount = amount
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}