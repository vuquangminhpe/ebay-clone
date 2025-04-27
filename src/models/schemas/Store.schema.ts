import { ObjectId } from 'mongodb'

export enum StoreStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

interface StoreType {
  _id?: ObjectId
  seller_id: ObjectId
  name: string
  description: string
  logo?: string
  banner?: string
  status: StoreStatus
  rating: number
  total_sales: number
  total_products: number
  policy?: string
  feedback_counts: {
    positive: number
    neutral: number
    negative: number
    total: number
  }
  positive_feedback_percent: number
  created_at: Date
  updated_at: Date
}

export default class Store {
  _id?: ObjectId
  seller_id: ObjectId
  name: string
  description: string
  logo?: string
  banner?: string
  status: StoreStatus
  rating: number
  total_sales: number
  total_products: number
  policy?: string
  created_at: Date
  updated_at: Date
  feedback_counts: {
    positive: number
    neutral: number
    negative: number
    total: number
  }
  positive_feedback_percent: number
  constructor({
    _id,
    seller_id,
    name,
    description,
    logo,
    banner,
    status,
    rating,
    total_sales,
    total_products,
    policy,
    created_at,
    updated_at,
    feedback_counts,
    positive_feedback_percent
  }: StoreType) {
    const date = new Date()
    this._id = _id
    this.seller_id = seller_id
    this.name = name
    this.description = description
    this.logo = logo
    this.banner = banner
    this.status = status
    this.rating = rating || 0
    this.total_sales = total_sales || 0
    this.total_products = total_products || 0
    this.policy = policy
    this.created_at = created_at || date
    this.updated_at = updated_at || date
    this.feedback_counts = feedback_counts || {
      positive: 0,
      neutral: 0,
      negative: 0,
      total: 0
    }
    this.positive_feedback_percent = positive_feedback_percent || 0
  }
}
