import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  createInventoryController,
  getInventoryController,
  getSellerInventoryController,
  getLowStockProductsController,
  updateInventoryController
} from '../controllers/inventory.controllers'

const inventoryRouter = Router()

// Authentication required for inventory management
inventoryRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Create inventory for a product
 * @route POST /inventory
 * @access Private - Seller only
 */
inventoryRouter.post('/', wrapAsync(createInventoryController))

/**
 * @description Update inventory for a product
 * @route PUT /inventory/:product_id
 * @access Private - Seller only
 */
inventoryRouter.put('/:product_id', wrapAsync(updateInventoryController))

/**
 * @description Get inventory for a product
 * @route GET /inventory/:product_id
 * @access Private - Seller only
 */
inventoryRouter.get('/:product_id', wrapAsync(getInventoryController))

/**
 * @description Get all inventory for a seller
 * @route GET /inventory/seller/me
 * @access Private - Seller only
 */
inventoryRouter.get('/seller/me', wrapAsync(getSellerInventoryController))

/**
 * @description Get low stock products for a seller
 * @route GET /inventory/low-stock
 * @access Private - Seller only
 */
inventoryRouter.get('/alerts/low-stock', wrapAsync(getLowStockProductsController))

export default inventoryRouter
