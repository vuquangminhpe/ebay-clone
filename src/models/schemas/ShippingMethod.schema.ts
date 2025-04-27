import { ObjectId } from 'mongodb'

export enum ShippingMethodTypes {
  STANDARD = 'standard',
  EXPRESS = 'express',
  NEXT_DAY = 'next_day',
  INTERNATIONAL = 'international',
  PICKUP = 'pickup'
}

interface ShippingMethodType {
  _id?: ObjectId
  name: string
  type: ShippingMethodTypes
  provider: string
  price_base: number
  price_per_kg?: number
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
  is_international: boolean
  regions_available?: string[]
  max_weight_kg?: number
  created_at?: Date
  updated_at?: Date
}

export default class ShippingMethod {
  _id?: ObjectId
  name: string
  type: ShippingMethodTypes
  provider: string
  price_base: number
  price_per_kg?: number
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
  is_international: boolean
  regions_available?: string[]
  max_weight_kg?: number
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    name,
    type,
    provider,
    price_base,
    price_per_kg,
    estimated_days_min,
    estimated_days_max,
    is_active,
    is_international,
    regions_available,
    max_weight_kg,
    created_at,
    updated_at
  }: ShippingMethodType) {
    const date = new Date()
    this._id = _id
    this.name = name
    this.type = type
    this.provider = provider
    this.price_base = price_base
    this.price_per_kg = price_per_kg
    this.estimated_days_min = estimated_days_min
    this.estimated_days_max = estimated_days_max
    this.is_active = is_active !== undefined ? is_active : true
    this.is_international = is_international || false
    this.regions_available = regions_available || []
    this.max_weight_kg = max_weight_kg
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
