import { Router } from 'express'
import {
  createCategoryController,
  getCategoriesController,
  getCategoryBySlugController,
  getCategoryController,
  getCategoryProductCountsController,
  getCategoryProductsController,
  getCategoryTreeController,
  getChildCategoriesController,
  getRootCategoriesController,
  updateCategoryController
} from '../controllers/category.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { createCategoryValidator, updateCategoryValidator } from '../middlewares/category.middlewares'
import { wrapAsync } from '../utils/handler'

const categoryRouter = Router()

/**
 * @description Get all categories
 * @route GET /categories
 * @access Public
 */
categoryRouter.get('/', wrapAsync(getCategoriesController))

/**
 * @description Get category tree (hierarchical structure)
 * @route GET /categories/tree
 * @access Public
 */
categoryRouter.get('/tree', wrapAsync(getCategoryTreeController))

/**
 * @description Get root categories (top-level categories)
 * @route GET /categories/root
 * @access Public
 */
categoryRouter.get('/root', wrapAsync(getRootCategoriesController))

/**
 * @description Get product counts by category
 * @route GET /categories/product-counts
 * @access Public
 */
categoryRouter.get('/product-counts', wrapAsync(getCategoryProductCountsController))

/**
 * @description Get child categories for a parent category
 * @route GET /categories/children/:parent_id
 * @access Public
 */
categoryRouter.get('/children/:parent_id', wrapAsync(getChildCategoriesController))

/**
 * @description Get category by slug
 * @route GET /categories/slug/:slug
 * @access Public
 */
categoryRouter.get('/slug/:slug', wrapAsync(getCategoryBySlugController))

/**
 * @description Get category by ID
 * @route GET /categories/:category_id
 * @access Public
 */
categoryRouter.get('/:category_id', wrapAsync(getCategoryController))

/**
 * @description Get products for a category
 * @route GET /categories/:category_id/products
 * @access Public
 */
categoryRouter.get('/:category_id/products', wrapAsync(getCategoryProductsController))

// Protected routes - require admin authentication
/**
 * @description Create a new category
 * @route POST /categories
 * @access Private (Admin only)
 */
categoryRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createCategoryValidator,
  wrapAsync(createCategoryController)
)

/**
 * @description Update a category
 * @route PUT /categories/:category_id
 * @access Private (Admin only)
 */
categoryRouter.put(
  '/:category_id',
  AccessTokenValidator,
  verifiedUserValidator,
  updateCategoryValidator,
  wrapAsync(updateCategoryController)
)

export default categoryRouter
