// src/services/shipping.services.ts
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import ShippingMethod, { ShippingMethodTypes } from '../models/schemas/ShippingMethod.schema'
import Shipment, { ShipmentStatus } from '../models/schemas/Shipment.schema'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import axios from 'axios'
import { envConfig } from '../constants/config'

class ShippingService {
  // Shipping Method Management
  async createShippingMethod({
    name,
    type,
    provider,
    price_base,
    price_per_kg,
    estimated_days_min,
    estimated_days_max,
    is_international,
    regions_available,
    max_weight_kg
  }: {
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
  }) {
    const shippingMethod = new ShippingMethod({
      name,
      type,
      provider,
      price_base,
      price_per_kg,
      estimated_days_min,
      estimated_days_max,
      is_active: true,
      is_international,
      regions_available,
      max_weight_kg
    })

    const result = await databaseService.shippingMethods.insertOne(shippingMethod)

    return { ...shippingMethod, _id: result.insertedId }
  }

  async getShippingMethods(is_international: boolean = false) {
    return databaseService.shippingMethods.find({ is_active: true, is_international }).sort({ price_base: 1 }).toArray()
  }

  async getShippingMethodById(shipping_method_id: string) {
    return databaseService.shippingMethods.findOne({ _id: new ObjectId(shipping_method_id) })
  }

  async calculateShippingCost(shipping_method_id: string, weight_kg: number, destination_country: string) {
    const shippingMethod = await this.getShippingMethodById(shipping_method_id)

    if (!shippingMethod) {
      throw new ErrorWithStatus({
        message: 'Shipping method not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check weight limit
    if (shippingMethod.max_weight_kg && weight_kg > shippingMethod.max_weight_kg) {
      throw new ErrorWithStatus({
        message: `Package weight exceeds the maximum allowed (${shippingMethod.max_weight_kg}kg)`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if the shipping method is available for the destination
    if (shippingMethod.is_international && shippingMethod.regions_available?.length) {
      if (!shippingMethod.regions_available.includes(destination_country)) {
        throw new ErrorWithStatus({
          message: 'Shipping method not available for the destination country',
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    // Calculate cost
    let cost = shippingMethod.price_base

    // Add per kg cost if applicable
    if (shippingMethod.price_per_kg) {
      cost += shippingMethod.price_per_kg * weight_kg
    }

    return {
      shipping_method: shippingMethod,
      weight_kg,
      destination_country,
      cost,
      estimated_delivery_days: {
        min: shippingMethod.estimated_days_min,
        max: shippingMethod.estimated_days_max
      }
    }
  }

  // Shipment Management
  async createShipment({
    order_id,
    shipping_method_id,
    tracking_number,
    carrier,
    weight_kg,
    dimensions,
    shipping_cost
  }: {
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
  }) {
    // Check if shipment already exists for order
    const existingShipment = await databaseService.shipments.findOne({
      order_id: new ObjectId(order_id)
    })

    if (existingShipment) {
      throw new ErrorWithStatus({
        message: 'Shipment already exists for this order',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get shipping method
    const shippingMethod = await this.getShippingMethodById(shipping_method_id)

    if (!shippingMethod) {
      throw new ErrorWithStatus({
        message: 'Shipping method not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Estimate delivery date
    const estimatedDeliveryDate = new Date()
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + shippingMethod.estimated_days_max)

    // Create shipment
    const shipment = new Shipment({
      order_id: new ObjectId(order_id),
      shipping_method_id: new ObjectId(shipping_method_id),
      tracking_number,
      carrier: carrier || shippingMethod.provider,
      status: ShipmentStatus.PENDING,
      estimated_delivery_date: estimatedDeliveryDate,
      weight_kg,
      dimensions,
      shipping_cost,
      tracking_history: [
        {
          status: ShipmentStatus.PENDING,
          timestamp: new Date(),
          description: 'Shipment created'
        }
      ]
    })

    const result = await databaseService.shipments.insertOne(shipment)

    return { ...shipment, _id: result.insertedId }
  }

  async updateShipmentStatus(
    shipment_id: string,
    {
      status,
      tracking_number,
      location,
      description
    }: {
      status: ShipmentStatus
      tracking_number?: string
      location?: string
      description?: string
    }
  ) {
    const shipment = await this.getShipmentById(shipment_id)

    if (!shipment) {
      throw new ErrorWithStatus({
        message: 'Shipment not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updateData: any = {
      status,
      updated_at: new Date()
    }

    // Update tracking number if provided
    if (tracking_number) {
      updateData.tracking_number = tracking_number
    }

    // Add tracking history entry
    const historyEntry = {
      status,
      timestamp: new Date(),
      location,
      description: description || `Status updated to ${status}`
    }

    // Special handling based on status
    if (status === ShipmentStatus.SHIPPED) {
      updateData.shipped_at = new Date()
    } else if (status === ShipmentStatus.DELIVERED) {
      updateData.actual_delivery_date = new Date()
    }

    await databaseService.shipments.updateOne(
      { _id: new ObjectId(shipment_id) },
      {
        $set: updateData,
        $push: { tracking_history: historyEntry }
      }
    )

    // If order status needs to be updated based on shipment status
    if (status === ShipmentStatus.SHIPPED || status === ShipmentStatus.DELIVERED) {
      await databaseService.orders.updateOne(
        { _id: shipment.order_id },
        {
          $set: {
            status: status === ShipmentStatus.SHIPPED ? ShipmentStatus.SHIPPED : (ShipmentStatus.DELIVERED as any),
            updated_at: new Date()
          }
        }
      )
    }

    return this.getShipmentById(shipment_id)
  }

  async getShipmentById(shipment_id: string) {
    return databaseService.shipments.findOne({ _id: new ObjectId(shipment_id) })
  }

  async getShipmentByOrderId(order_id: string) {
    return databaseService.shipments.findOne({ order_id: new ObjectId(order_id) })
  }

  async getShipmentByTrackingNumber(tracking_number: string) {
    return databaseService.shipments.findOne({ tracking_number })
  }

  // Tracking integration with third-party APIs
  async trackShipment(tracking_number: string, carrier?: string) {
    // Get shipment if it exists in our system
    const shipment = await this.getShipmentByTrackingNumber(tracking_number)

    // For demo purposes, we'll simulate a tracking API call
    // In a real application, this would connect to carriers' APIs
    try {
      // Simulated API call to tracking service
      // const response = await axios.get(`https://api.tracktry.com/v1/trackings/${carrier}/${tracking_number}`, {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Tracktry-Api-Key': envConfig.tracktry_api_key
      //   }
      // })

      // Simulated response
      const trackingInfo = {
        carrier: carrier || (shipment ? shipment.carrier : 'unknown'),
        tracking_number,
        status: shipment ? shipment.status : ShipmentStatus.IN_TRANSIT,
        estimated_delivery: shipment
          ? shipment.estimated_delivery_date
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        events: shipment
          ? shipment.tracking_history
          : [
              {
                status: ShipmentStatus.IN_TRANSIT,
                location: 'Distribution Center',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                description: 'Package is in transit'
              }
            ]
      }

      // If we have this shipment in our system, update it with the latest tracking info
      if (shipment) {
        // In a real implementation, we would update our shipment with carrier data
        // For now, we'll just return the existing data
      }

      return trackingInfo
    } catch (error) {
      console.error('Tracking API error:', error)
      throw new ErrorWithStatus({
        message: 'Failed to retrieve tracking information',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }
  }

  // Shipping label generation (simulated)
  async generateShippingLabel(shipment_id: string) {
    const shipment = await this.getShipmentById(shipment_id)

    if (!shipment) {
      throw new ErrorWithStatus({
        message: 'Shipment not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get the order details including addresses
    const order = await databaseService.orders.findOne({ _id: shipment.order_id })

    if (!order) {
      throw new ErrorWithStatus({
        message: 'Order not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get shipping address
    const shippingAddress = await databaseService.addresses.findOne({ _id: order.shipping_address_id })

    if (!shippingAddress) {
      throw new ErrorWithStatus({
        message: 'Shipping address not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // In a real implementation, we would call a shipping API to generate a label
    // For now, we'll simulate a label URL
    const labelUrl = `https://ebay-clone-api.com/shipping-labels/${shipment_id}.pdf`

    // Update shipment with label URL
    await databaseService.shipments.updateOne(
      { _id: new ObjectId(shipment_id) },
      {
        $set: {
          shipping_label_url: labelUrl,
          updated_at: new Date()
        }
      }
    )

    return {
      shipment_id: shipment._id,
      tracking_number: shipment.tracking_number,
      carrier: shipment.carrier,
      label_url: labelUrl
    }
  }
}

const shippingService = new ShippingService()
export default shippingService
