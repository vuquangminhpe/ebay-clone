/* eslint-disable @typescript-eslint/no-explicit-any */
import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

// Request types
export interface AddPaymentMethodRequest {
  type: PaymentMethodTypes
  details: any
  set_default?: boolean
}

export interface CreatePaypalOrderRequest {
  amount: number
  currency?: string
  description?: string
}

export interface CapturePaypalPaymentRequest {
  order_id: string
}

// Response types
export interface PaymentMethodResponse {
  _id: string
  user_id: string
  type: PaymentMethodTypes
  status: PaymentMethodStatus
  is_default: boolean
  details: any
  created_at: string
  updated_at: string
}

export interface PaypalOrderResponse {
  id: string
  status: string
  links: Array<{
    href: string
    rel: string
    method: string
  }>
  // Other PayPal order details
}

export interface CapturePaypalResponse {
  capture_details: any // PayPal capture response details
  transaction: TransactionResponse
}

export interface TransactionResponse {
  _id: string
  order_id?: string
  user_id: string
  seller_id?: string
  amount: number
  type: TransactionTypes
  status: TransactionStatus
  payment_method_id?: string
  provider: PaymentProvider
  provider_transaction_id?: string
  provider_fee?: number
  notes?: string
  metadata?: any
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface TransactionWithDetailsResponse extends TransactionResponse {
  order?: {
    order_number: string
    status: string
    total_amount: number
  } | null
  buyer?: {
    name: string
    username: string
  } | null
}

export interface TransactionsResponse {
  transactions: TransactionWithDetailsResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Enums
export enum PaymentMethodTypes {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_ACCOUNT = 'bank_account'
}

export enum PaymentMethodStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  INVALID = 'invalid'
}

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
  REFUNDED = 'refunded'
}

export enum PaymentProvider {
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  SYSTEM = 'system'
}

// Query parameters
export interface TransactionQueryParams {
  type?: TransactionTypes
  status?: TransactionStatus
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

// API Client
export const PaymentApi = {
  /**
   * Add a payment method
   * @role Authenticated user
   */
  addPaymentMethod: (request: AddPaymentMethodRequest) =>
    http.post<SuccessResponse<PaymentMethodResponse>>('payments/methods', request),

  /**
   * Get user's payment methods
   * @role Authenticated user
   */
  getUserPaymentMethods: () => http.get<SuccessResponse<PaymentMethodResponse[]>>('payments/methods'),

  /**
   * Set default payment method
   * @role Authenticated user
   */
  setDefaultPaymentMethod: (payment_method_id: string) =>
    http.put<SuccessResponse<PaymentMethodResponse>>(`payments/methods/${payment_method_id}/default`),

  /**
   * Delete payment method
   * @role Authenticated user
   */
  deletePaymentMethod: (payment_method_id: string) =>
    http.delete<SuccessResponse<{ success: boolean }>>(`payments/methods/${payment_method_id}`),

  /**
   * Create PayPal order
   * @role Public (non-authenticated)
   */
  createPaypalOrder: (request: CreatePaypalOrderRequest) =>
    http.post<SuccessResponse<PaypalOrderResponse>>('payments/paypal/create-order', request),

  /**
   * Capture PayPal payment
   * @role Authenticated user
   */
  capturePaypalPayment: (request: CapturePaypalPaymentRequest) =>
    http.post<SuccessResponse<CapturePaypalResponse>>('payments/paypal/capture', request),

  /**
   * Get user transactions
   * @role Authenticated user
   */
  getUserTransactions: (params?: TransactionQueryParams) =>
    http.get<SuccessResponse<TransactionsResponse>>('payments/transactions/buyer', { params }),

  /**
   * Get seller transactions
   * @role Seller only
   */
  getSellerTransactions: (params?: TransactionQueryParams) =>
    http.get<SuccessResponse<TransactionsResponse>>('payments/transactions/seller', { params })
}

export default PaymentApi
