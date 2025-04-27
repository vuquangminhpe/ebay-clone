import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

// Request types
export interface CalculateShippingCostRequest {
  shipping_method_id: string
  weight_kg: number
  destination_country: string
}

export interface CreateShippingMethodRequest {
  name: string
  type: ShippingMethodTypes
  provider: string
  price_base: number
  price_per_kg?: number
  estimated_days_min: number
  estimated_days_max: number
  is_international: boolean
  regions_available?: string[]
  max_weight_kg?: number
}

export interface CreateShipmentRequest {
  order_id: string
  shipping_method_id: string
  tracking_number?: string
  carrier?: string
  weight_kg?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: string
  }
  shipping_cost: number
}

export interface UpdateShipmentStatusRequest {
  status: ShipmentStatus
  tracking_number?: string
  location?: string
  description?: string
}

// Response types
export interface ShippingMethodResponse {
  _id: string
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
  created_at: string
  updated_at: string
}

export interface ShippingCostResponse {
  shipping_method: ShippingMethodResponse
  weight_kg: number
  destination_country: string
  cost: number
  estimated_delivery_days: {
    min: number
    max: number
  }
}

export interface ShipmentResponse {
  _id: string
  order_id: string
  shipping_method_id: string
  tracking_number?: string
  carrier?: string
  status: ShipmentStatus
  estimated_delivery_date: string
  weight_kg?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: string
  }
  shipping_cost: number
  shipped_at?: string
  actual_delivery_date?: string
  shipping_label_url?: string
  tracking_history: Array<{
    status: ShipmentStatus
    timestamp: string
    location?: string
    description?: string
  }>
  created_at: string
  updated_at: string
}

export interface TrackingInfoResponse {
  carrier: string
  tracking_number: string
  status: ShipmentStatus
  estimated_delivery: string
  events: Array<{
    status: ShipmentStatus
    location?: string
    timestamp: string
    description?: string
  }>
}

export interface ShippingLabelResponse {
  shipment_id: string
  tracking_number?: string
  carrier: string
  label_url: string
}

// Enums
export enum ShippingMethodTypes {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  ECONOMY = 'economy',
  INTERNATIONAL = 'international'
}

export enum ShipmentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
  RETURNED = 'returned'
}

// API Client
export const ShippingApi = {
  /**
   * Get available shipping methods
   * @role Public
   */
  getShippingMethods: (international: boolean = false) =>
    http.get<SuccessResponse<ShippingMethodResponse[]>>('shipping/methods', {
      params: { international }
    }),

  /**
   * Calculate shipping cost
   * @role Public
   */
  calculateShippingCost: (request: CalculateShippingCostRequest) =>
    http.post<SuccessResponse<ShippingCostResponse>>('shipping/calculate', request),

  /**
   * Track a shipment
   * @role Public
   */
  trackShipment: (tracking_number: string, carrier?: string) =>
    http.get<SuccessResponse<TrackingInfoResponse>>(`shipping/track/${tracking_number}`, {
      params: { carrier }
    }),

  /**
   * Create a shipping method (admin only)
   * @role Admin only
   */
  createShippingMethod: (request: CreateShippingMethodRequest) =>
    http.post<SuccessResponse<ShippingMethodResponse>>('shipping/methods', request),

  /**
   * Create a shipment
   * @role Seller or Admin
   */
  createShipment: (request: CreateShipmentRequest) =>
    http.post<SuccessResponse<ShipmentResponse>>('shipping/shipments', request),

  /**
   * Update shipment status
   * @role Seller or Admin
   */
  updateShipmentStatus: (shipment_id: string, request: UpdateShipmentStatusRequest) =>
    http.put<SuccessResponse<ShipmentResponse>>(`shipping/shipments/${shipment_id}`, request),

  /**
   * Get shipment by ID
   * @role Authenticated user (buyer, seller or admin)
   */
  getShipmentById: (shipment_id: string) =>
    http.get<SuccessResponse<ShipmentResponse>>(`shipping/shipments/${shipment_id}`),

  /**
   * Get shipment by order ID
   * @role Authenticated user (buyer, seller or admin)
   */
  getShipmentByOrderId: (order_id: string) =>
    http.get<SuccessResponse<ShipmentResponse>>(`shipping/orders/${order_id}`),

  /**
   * Generate shipping label
   * @role Seller or Admin
   */
  generateShippingLabel: (shipment_id: string) =>
    http.post<SuccessResponse<ShippingLabelResponse>>(`shipping/shipments/${shipment_id}/label`)
}

export default ShippingApi
