import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import shippingService from '../services/shipping.services'
import { ShippingMethodTypes } from '../models/schemas/ShippingMethod.schema'
import { ShipmentStatus } from '../models/schemas/Shipment.schema'
import { UserRole } from '../models/schemas/User.schema'

// Define request body interfaces
interface CreateShippingMethodReqBody {
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

interface CalculateShippingCostReqBody {
  shipping_method_id: string
  weight_kg: number
  destination_country: string
}

interface CreateShipmentReqBody {
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

interface UpdateShipmentStatusReqBody {
  status: ShipmentStatus
  tracking_number?: string
  location?: string
  description?: string
}

// Define request params interface
interface ShipmentParams extends ParamsDictionary {
  shipment_id: string
}

interface TrackingParams extends ParamsDictionary {
  tracking_number: string
}

interface OrderShipmentParams extends ParamsDictionary {
  order_id: string
}

export const createShippingMethodController = async (
  req: Request<ParamsDictionary, any, CreateShippingMethodReqBody>,
  res: Response
) => {
  const { role } = req.decode_authorization as TokenPayload
  const {
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
  } = req.body

  try {
    // Only admins can create shipping methods
    if (role !== UserRole.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Only administrators can create shipping methods'
      })
    }

    const result = await shippingService.createShippingMethod({
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
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Shipping method created successfully',
      result
    })
  } catch (error) {
    console.error('Create shipping method error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to create shipping method'
    })
  }
}

export const getShippingMethodsController = async (req: Request, res: Response) => {
  const { international = 'false' } = req.query

  try {
    const shippingMethods = await shippingService.getShippingMethods(international === 'true')

    return res.status(HTTP_STATUS.OK).json({
      message: 'Shipping methods retrieved successfully',
      result: shippingMethods
    })
  } catch (error) {
    console.error('Get shipping methods error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get shipping methods'
    })
  }
}

export const calculateShippingCostController = async (
  req: Request<ParamsDictionary, any, CalculateShippingCostReqBody>,
  res: Response
) => {
  const { shipping_method_id, weight_kg, destination_country } = req.body

  try {
    const result = await shippingService.calculateShippingCost(shipping_method_id, weight_kg, destination_country)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Shipping cost calculated successfully',
      result
    })
  } catch (error) {
    console.error('Calculate shipping cost error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to calculate shipping cost'
    })
  }
}

export const createShipmentController = async (
  req: Request<ParamsDictionary, any, CreateShipmentReqBody>,
  res: Response
) => {
  const { role } = req.decode_authorization as TokenPayload
  const { order_id, shipping_method_id, tracking_number, carrier, weight_kg, dimensions, shipping_cost } = req.body

  try {
    // Only sellers or admins can create shipments
    if (role !== UserRole.SELLER && role !== UserRole.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Only sellers or administrators can create shipments'
      })
    }

    const result = await shippingService.createShipment({
      order_id,
      shipping_method_id,
      tracking_number,
      carrier,
      weight_kg,
      dimensions,
      shipping_cost
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Shipment created successfully',
      result
    })
  } catch (error) {
    console.error('Create shipment error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to create shipment'
    })
  }
}

export const updateShipmentStatusController = async (
  req: Request<ShipmentParams, any, UpdateShipmentStatusReqBody>,
  res: Response
) => {
  const { role } = req.decode_authorization as TokenPayload
  const { shipment_id } = req.params
  const { status, tracking_number, location, description } = req.body

  try {
    // Only sellers or admins can update shipments
    if (role !== UserRole.SELLER && role !== UserRole.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Only sellers or administrators can update shipments'
      })
    }

    const result = await shippingService.updateShipmentStatus(shipment_id, {
      status,
      tracking_number,
      location,
      description
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Shipment status updated successfully',
      result
    })
  } catch (error) {
    console.error('Update shipment status error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to update shipment status'
    })
  }
}

export const getShipmentByIdController = async (req: Request<ShipmentParams>, res: Response) => {
  const { shipment_id } = req.params

  try {
    const shipment = await shippingService.getShipmentById(shipment_id)

    if (!shipment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Shipment not found'
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Shipment retrieved successfully',
      result: shipment
    })
  } catch (error) {
    console.error('Get shipment error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get shipment'
    })
  }
}

export const getShipmentByOrderIdController = async (req: Request<OrderShipmentParams>, res: Response) => {
  const { order_id } = req.params

  try {
    const shipment = await shippingService.getShipmentByOrderId(order_id)

    if (!shipment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'No shipment found for this order'
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Shipment retrieved successfully',
      result: shipment
    })
  } catch (error) {
    console.error('Get shipment by order error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get shipment'
    })
  }
}

export const trackShipmentController = async (req: Request<TrackingParams>, res: Response) => {
  const { tracking_number } = req.params
  const { carrier } = req.query

  try {
    const trackingInfo = await shippingService.trackShipment(tracking_number, carrier as string)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Tracking information retrieved successfully',
      result: trackingInfo
    })
  } catch (error) {
    console.error('Track shipment error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to track shipment'
    })
  }
}

export const generateShippingLabelController = async (req: Request<ShipmentParams>, res: Response) => {
  const { role } = req.decode_authorization as TokenPayload
  const { shipment_id } = req.params

  try {
    // Only sellers or admins can generate labels
    if (role !== UserRole.SELLER && role !== UserRole.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Only sellers or administrators can generate shipping labels'
      })
    }

    const result = await shippingService.generateShippingLabel(shipment_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Shipping label generated successfully',
      result
    })
  } catch (error) {
    console.error('Generate shipping label error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to generate shipping label'
    })
  }
}
