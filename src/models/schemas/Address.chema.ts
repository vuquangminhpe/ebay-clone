import { ObjectId } from 'mongodb'

interface AddressType {
  _id?: ObjectId
  user_id: ObjectId
  name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  created_at?: Date
  updated_at?: Date
}

export default class Address {
  _id?: ObjectId
  user_id: ObjectId
  name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    user_id,
    name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    is_default,
    created_at,
    updated_at
  }: AddressType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.name = name
    this.phone = phone
    this.address_line1 = address_line1
    this.address_line2 = address_line2
    this.city = city
    this.state = state
    this.postal_code = postal_code
    this.country = country
    this.is_default = is_default
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
