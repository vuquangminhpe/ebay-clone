// src/routes/feedback.routes.ts
import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  createFeedbackController,
  getBuyerFeedbackController,
  getSellerFeedbackController,
  getSellerFeedbackSummaryController,
  replyToFeedbackController
} from '../controllers/feedback.controllers'

const feedbackRouter = Router()

/**
 * @description Get feedback for a seller
 * @route GET /feedback/seller/:seller_id
 * @access Public
 */
feedbackRouter.get('/seller/:seller_id', wrapAsync(getSellerFeedbackController))

/**
 * @description Get feedback summary for a seller
 * @route GET /feedback/seller/:seller_id/summary
 * @access Public
 */
feedbackRouter.get('/seller/:seller_id/summary', wrapAsync(getSellerFeedbackSummaryController))

// Protected routes - require authentication
feedbackRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Create feedback for a seller
 * @route POST /feedback
 * @access Private - Buyer only
 */
feedbackRouter.post('/', wrapAsync(createFeedbackController))

/**
 * @description Reply to feedback
 * @route POST /feedback/:feedback_id/reply
 * @access Private - Seller who received the feedback or admin
 */
feedbackRouter.post('/:feedback_id/reply', wrapAsync(replyToFeedbackController))

/**
 * @description Get buyer's feedback history
 * @route GET /feedback/me
 * @access Private
 */
feedbackRouter.get('/me', wrapAsync(getBuyerFeedbackController))

export default feedbackRouter
