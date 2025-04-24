import { ObjectId } from 'mongodb'

export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export enum ProductStatus {
  ACTIVE = 'active',
  SOLD_OUT = 'sold_out',
  DRAFT = 'draft',
  HIDDEN = 'hidden',
  DELETED = 'deleted'
}

export interface ProductMedia {
  url: string
  type: string
  is_primary: boolean
}

export interface ProductVariant {
  _id?: ObjectId
  name: string
  price: number
  stock: number
  attributes: Record<string, string>
}

interface ProductType {
  _id?: ObjectId
  seller_id: ObjectId
  name: string
  description: string
  price: number
  quantity: number
  category_id: ObjectId
  condition: ProductCondition
  status: ProductStatus
  medias: ProductMedia[]
  tags: string[]
  variants?: ProductVariant[]
  shipping_price: number
  free_shipping: boolean
  views: number
  created_at?: Date
  updated_at?: Date
}

export default class Product {
  _id?: ObjectId
  seller_id: ObjectId
  name: string
  description: string
  price: number
  quantity: number
  category_id: ObjectId
  condition: ProductCondition
  status: ProductStatus
  medias: ProductMedia[]
  tags: string[]
  variants?: ProductVariant[]
  shipping_price: number
  free_shipping: boolean
  views: number
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    seller_id,
    name,
    description,
    price,
    quantity,
    category_id,
    condition,
    status,
    medias,
    tags,
    variants,
    shipping_price,
    free_shipping,
    views,
    created_at,
    updated_at
  }: ProductType) {
    const date = new Date()
    this._id = _id
    this.seller_id = seller_id
    this.name = name
    this.description = description
    this.price = price
    this.quantity = quantity
    this.category_id = category_id
    this.condition = condition
    this.status = status
    this.medias = medias
    this.tags = tags
    this.variants = variants
    this.shipping_price = shipping_price
    this.free_shipping = free_shipping
    this.views = views || 0
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
