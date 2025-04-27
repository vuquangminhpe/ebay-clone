import { ObjectId } from 'mongodb'

export enum TransactionTypes {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PAYOUT = 'payout',
  FEE = 'fee'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentProvider {
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  BANK = 'bank',
  SYSTEM = 'system'
}

interface TransactionType {
  _id?: ObjectId
  order_id?: ObjectId
  user_id: ObjectId
  seller_id?: ObjectId
  amount: number
  type: TransactionTypes
  status: TransactionStatus
  payment_method_id?: ObjectId
  provider: PaymentProvider
  provider_transaction_id?: string
  provider_fee?: number
  notes?: string
  metadata?: {
    [key: string]: any
  }
  created_at?: Date
  updated_at?: Date
  completed_at?: Date
}

export default class Transaction {
  _id?: ObjectId
  order_id?: ObjectId
  user_id: ObjectId
  seller_id?: ObjectId
  amount: number
  type: TransactionTypes
  status: TransactionStatus
  payment_method_id?: ObjectId
  provider: PaymentProvider
  provider_transaction_id?: string
  provider_fee?: number
  notes?: string
  metadata?: {
    [key: string]: any
  }
  created_at: Date
  updated_at: Date
  completed_at?: Date

  constructor({
    _id,
    order_id,
    user_id,
    seller_id,
    amount,
    type,
    status,
    payment_method_id,
    provider,
    provider_transaction_id,
    provider_fee,
    notes,
    metadata,
    created_at,
    updated_at,
    completed_at
  }: TransactionType) {
    const date = new Date()
    this._id = _id
    this.order_id = order_id
    this.user_id = user_id
    this.seller_id = seller_id
    this.amount = amount
    this.type = type
    this.status = status || TransactionStatus.PENDING
    this.payment_method_id = payment_method_id
    this.provider = provider
    this.provider_transaction_id = provider_transaction_id
    this.provider_fee = provider_fee || 0
    this.notes = notes
    this.metadata = metadata || {}
    this.created_at = created_at || date
    this.updated_at = updated_at || date
    this.completed_at = completed_at
  }
}
