import { Router } from 'express'
import {
  checkCanReviewController,
  createReviewController,
  deleteReviewController,
  getMyReviewsController,
  getProductReviewsController,
  getReviewController,
  getSellerReviewsController,
  updateReviewController
} from '../controllers/review.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { createReviewValidator, updateReviewValidator } from '../middlewares/review.middlewares'
import { wrapAsync } from '../utils/handler'

const reviewRouter = Router()

/**
 * @description Get reviews for a product
 * @route GET /reviews/product/:product_id
 * @access Public
 */
reviewRouter.get('/product/:product_id', wrapAsync(getProductReviewsController))

/**
 * @description Get reviews for a seller
 * @route GET /reviews/seller/:seller_id
 * @access Public
 */
reviewRouter.get('/seller/:seller_id', wrapAsync(getSellerReviewsController))

/**
 * @description Get a single review by ID
 * @route GET /reviews/:review_id
 * @access Public
 */
reviewRouter.get('/:review_id', wrapAsync(getReviewController))

// Protected routes - require authentication
/**
 * @description Create a new review
 * @route POST /reviews
 * @access Private
 */
reviewRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createReviewValidator,
  wrapAsync(createReviewController)
)

/**
 * @description Update a review
 * @route PUT /reviews/:review_id
 * @access Private - Author of review only
 */
reviewRouter.put(
  '/:review_id',
  AccessTokenValidator,
  verifiedUserValidator,
  updateReviewValidator,
  wrapAsync(updateReviewController)
)

/**
 * @description Delete a review
 * @route DELETE /reviews/:review_id
 * @access Private - Author of review only
 */
reviewRouter.delete('/:review_id', AccessTokenValidator, verifiedUserValidator, wrapAsync(deleteReviewController))

/**
 * @description Get current user's reviews
 * @route GET /reviews/me
 * @access Private
 */
reviewRouter.get('/me', AccessTokenValidator, verifiedUserValidator, wrapAsync(getMyReviewsController))

/**
 * @description Check if user can review a product from an order
 * @route GET /reviews/check-eligibility
 * @access Private
 */
reviewRouter.get('/check-eligibility', AccessTokenValidator, verifiedUserValidator, wrapAsync(checkCanReviewController))

export default reviewRouter
