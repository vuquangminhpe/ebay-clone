import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  createReturnRequestController,
  getBuyerReturnRequestsController,
  getReturnRequestController,
  getSellerReturnRequestsController,
  updateReturnRequestStatusController
} from '../controllers/returnRequest.controllers'

const returnRequestRouter = Router()

// Authentication required for return requests
returnRequestRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Create a return request
 * @route POST /returns
 * @access Private - Buyer only
 */
returnRequestRouter.post('/', wrapAsync(createReturnRequestController))

/**
 * @description Update a return request status
 * @route PUT /returns/:return_id
 * @access Private - Seller of returned item or admin
 */
returnRequestRouter.put('/:return_id', wrapAsync(updateReturnRequestStatusController))

/**
 * @description Get a specific return request
 * @route GET /returns/:return_id
 * @access Private - Involved parties only
 */
returnRequestRouter.get('/:return_id', wrapAsync(getReturnRequestController))

/**
 * @description Get buyer's return requests
 * @route GET /returns/buyer/me
 * @access Private - Buyer only
 */
returnRequestRouter.get('/buyer/me', wrapAsync(getBuyerReturnRequestsController))

/**
 * @description Get seller's return requests
 * @route GET /returns/seller/me
 * @access Private - Seller only
 */
returnRequestRouter.get('/seller/me', wrapAsync(getSellerReturnRequestsController))

export default returnRequestRouter
