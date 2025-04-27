import { ObjectId } from 'mongodb'

export enum PaymentMethodTypes {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CRYPTO = 'crypto'
}

export enum PaymentMethodStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_VERIFICATION = 'pending_verification'
}

interface PaymentMethodType {
  _id?: ObjectId
  user_id: ObjectId
  type: PaymentMethodTypes
  status: PaymentMethodStatus
  is_default: boolean
  details: {
    [key: string]: any
  }
  created_at?: Date
  updated_at?: Date
  last_used_at?: Date
}

export default class PaymentMethod {
  _id?: ObjectId
  user_id: ObjectId
  type: PaymentMethodTypes
  status: PaymentMethodStatus
  is_default: boolean
  details: {
    [key: string]: any
  }
  created_at: Date
  updated_at: Date
  last_used_at?: Date

  constructor({
    _id,
    user_id,
    type,
    status,
    is_default,
    details,
    created_at,
    updated_at,
    last_used_at
  }: PaymentMethodType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.type = type
    this.status = status || PaymentMethodStatus.PENDING_VERIFICATION
    this.is_default = is_default || false
    this.details = details || {}
    this.created_at = created_at || date
    this.updated_at = updated_at || date
    this.last_used_at = last_used_at
  }
}
