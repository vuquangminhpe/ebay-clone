import { Router } from 'express'
import {
  createProductController,
  deleteProductController,
  getProductController,
  getProductsController,
  getSellerProductsController,
  updateProductController
} from '../controllers/products.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { createProductValidator, updateProductValidator } from '../middlewares/product.middlewares'
import { wrapAsync } from '../utils/handler'
import { makeOptional } from '../utils/makeOptional'

const productsRouter = Router()

/**
 * @description Get products with filtering and pagination
 * @route GET /products
 * @access Public
 */
productsRouter.get('/', wrapAsync(getProductsController))

/**
 * @description Get a single product by ID
 * @route GET /products/:product_id
 * @access Public
 */
productsRouter.get('/:product_id', makeOptional(AccessTokenValidator), wrapAsync(getProductController))

/**
 * @description Create a new product
 * @route POST /products
 * @access Private - Seller only
 */
productsRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createProductValidator,
  wrapAsync(createProductController)
)

/**
 * @description Update a product
 * @route PUT /products/:product_id
 * @access Private - Seller only, owner of product
 */
productsRouter.put(
  '/:product_id',
  AccessTokenValidator,
  verifiedUserValidator,
  updateProductValidator,
  wrapAsync(updateProductController)
)

/**
 * @description Delete a product (soft delete)
 * @route DELETE /products/:product_id
 * @access Private - Seller only, owner of product or admin
 */
productsRouter.delete('/:product_id', AccessTokenValidator, verifiedUserValidator, wrapAsync(deleteProductController))

/**
 * @description Get seller's products
 * @route GET /products/seller/me
 * @access Private - Seller only
 */
productsRouter.get('/seller/me', AccessTokenValidator, verifiedUserValidator, wrapAsync(getSellerProductsController))

export default productsRouter
