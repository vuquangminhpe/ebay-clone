import { ObjectId } from 'mongodb'

interface InventoryType {
  _id?: ObjectId
  product_id: ObjectId
  quantity: number
  sku?: string
  location?: string
  reserved_quantity?: number
  last_restock_date?: Date
  created_at?: Date
  updated_at?: Date
}

export default class Inventory {
  _id?: ObjectId
  product_id: ObjectId
  quantity: number
  sku?: string
  location?: string
  reserved_quantity: number
  last_restock_date?: Date
  created_at: Date
  updated_at: Date

  constructor({ 
    _id, 
    product_id, 
    quantity, 
    sku, 
    location, 
    reserved_quantity, 
    last_restock_date,
    created_at, 
    updated_at 
  }: InventoryType) {
    const date = new Date()
    this._id = _id
    this.product_id = product_id
    this.quantity = quantity
    this.sku = sku
    this.location = location
    this.reserved_quantity = reserved_quantity || 0
    this.last_restock_date = last_restock_date
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}