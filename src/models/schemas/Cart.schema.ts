import { ObjectId } from 'mongodb'

export interface CartItem {
  product_id: ObjectId
  quantity: number
  price: number
  variant_id?: ObjectId
  selected: boolean
}

interface CartType {
  _id?: ObjectId
  user_id: ObjectId
  items: CartItem[]
  created_at?: Date
  updated_at?: Date
}

export default class Cart {
  _id?: ObjectId
  user_id: ObjectId
  items: CartItem[]
  created_at: Date
  updated_at: Date

  constructor({ _id, user_id, items, created_at, updated_at }: CartType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.items = items || []
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
