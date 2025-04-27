import { ObjectId } from 'mongodb'

interface MessageType {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  read: boolean
  related_order_id?: ObjectId
  related_product_id?: ObjectId
  created_at?: Date
  updated_at?: Date
  read_at?: Date
}

export default class Message {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  read: boolean
  related_order_id?: ObjectId
  related_product_id?: ObjectId
  created_at: Date
  updated_at: Date
  read_at?: Date

  constructor({
    _id,
    sender_id,
    receiver_id,
    content,
    read,
    related_order_id,
    related_product_id,
    created_at,
    updated_at,
    read_at
  }: MessageType) {
    const date = new Date()
    this._id = _id
    this.sender_id = sender_id
    this.receiver_id = receiver_id
    this.content = content
    this.read = read || false
    this.related_order_id = related_order_id
    this.related_product_id = related_product_id
    this.created_at = created_at || date
    this.updated_at = updated_at || date
    this.read_at = read_at
  }
}
