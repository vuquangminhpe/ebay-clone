import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  createBidController,
  getProductBidsController,
  getUserBidsController,
  getWonAuctionsController
} from '../controllers/bid.controllers'

const bidRouter = Router()

// Authentication required for bidding
bidRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Create a new bid on auction product
 * @route POST /bids/:product_id
 * @access Private
 */
bidRouter.post('/:product_id', wrapAsync(createBidController))

/**
 * @description Get bids for a product
 * @route GET /bids/product/:product_id
 * @access Private
 */
bidRouter.get('/product/:product_id', wrapAsync(getProductBidsController))

/**
 * @description Get user's bids
 * @route GET /bids/me
 * @access Private
 */
bidRouter.get('/me', wrapAsync(getUserBidsController))

/**
 * @description Get user's won auctions
 * @route GET /bids/won
 * @access Private
 */
bidRouter.get('/won', wrapAsync(getWonAuctionsController))

export default bidRouter
