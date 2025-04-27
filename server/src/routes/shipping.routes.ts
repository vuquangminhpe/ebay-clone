import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  calculateShippingCostController,
  createShipmentController,
  createShippingMethodController,
  generateShippingLabelController,
  getShipmentByIdController,
  getShipmentByOrderIdController,
  getShippingMethodsController,
  trackShipmentController,
  updateShipmentStatusController
} from '../controllers/shipping.controllers'

const shippingRouter = Router()

// Public routes (non-authenticated)
/**
 * @description Get available shipping methods
 * @route GET /shipping/methods
 * @access Public
 */
shippingRouter.get('/methods', wrapAsync(getShippingMethodsController))

/**
 * @description Calculate shipping cost
 * @route POST /shipping/calculate
 * @access Public
 */
shippingRouter.post('/calculate', wrapAsync(calculateShippingCostController))

/**
 * @description Track a shipment
 * @route GET /shipping/track/:tracking_number
 * @access Public
 */
shippingRouter.get('/track/:tracking_number', wrapAsync(trackShipmentController))

// Protected routes - require authentication
shippingRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Create a shipping method (admin only)
 * @route POST /shipping/methods
 * @access Private - Admin only
 */
shippingRouter.post('/methods', wrapAsync(createShippingMethodController))

/**
 * @description Create a shipment
 * @route POST /shipping/shipments
 * @access Private - Seller or Admin
 */
shippingRouter.post('/shipments', wrapAsync(createShipmentController))

/**
 * @description Update shipment status
 * @route PUT /shipping/shipments/:shipment_id
 * @access Private - Seller or Admin
 */
shippingRouter.put('/shipments/:shipment_id', wrapAsync(updateShipmentStatusController))

/**
 * @description Get shipment by ID
 * @route GET /shipping/shipments/:shipment_id
 * @access Private
 */
shippingRouter.get('/shipments/:shipment_id', wrapAsync(getShipmentByIdController))

/**
 * @description Get shipment by order ID
 * @route GET /shipping/orders/:order_id
 * @access Private
 */
shippingRouter.get('/orders/:order_id', wrapAsync(getShipmentByOrderIdController))

/**
 * @description Generate shipping label
 * @route POST /shipping/shipments/:shipment_id/label
 * @access Private - Seller or Admin
 */
shippingRouter.post('/shipments/:shipment_id/label', wrapAsync(generateShippingLabelController))

export default shippingRouter
