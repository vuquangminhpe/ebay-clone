import { Router } from 'express'
import {
  createAddressController,
  deleteAddressController,
  findNearbyAddressesController,
  getAddressController,
  getUserAddressesController,
  setDefaultAddressController,
  updateAddressController
} from '../controllers/address.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import {
  createAddressValidator,
  updateAddressValidator,
  setDefaultAddressValidator
} from '../middlewares/address.middlewares'
import { wrapAsync } from '../utils/handler'

const addressRouter = Router()

// All address routes require authentication
addressRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Get user's addresses
 * @route GET /addresses
 * @access Private
 */
addressRouter.get('/', wrapAsync(getUserAddressesController))

/**
 * @description Create a new address
 * @route POST /addresses
 * @access Private
 */
addressRouter.post('/', createAddressValidator, wrapAsync(createAddressController))

/**
 * @description Get an address by ID
 * @route GET /addresses/:address_id
 * @access Private - Owner of address only
 */
addressRouter.get('/:address_id', wrapAsync(getAddressController))

/**
 * @description Update an address
 * @route PUT /addresses/:address_id
 * @access Private - Owner of address only
 */
addressRouter.put('/:address_id', updateAddressValidator, wrapAsync(updateAddressController))

/**
 * @description Delete an address
 * @route DELETE /addresses/:address_id
 * @access Private - Owner of address only
 */
addressRouter.delete('/:address_id', wrapAsync(deleteAddressController))

/**
 * @description Set an address as default
 * @route POST /addresses/default
 * @access Private
 */
addressRouter.post('/default', setDefaultAddressValidator, wrapAsync(setDefaultAddressController))
/**
 * @description Find addresses near a location
 * @route GET /addresses/nearby
 * @access Private
 */
addressRouter.get('/nearby', AccessTokenValidator, verifiedUserValidator, wrapAsync(findNearbyAddressesController))
export default addressRouter
