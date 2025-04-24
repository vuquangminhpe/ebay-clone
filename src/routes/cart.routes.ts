import { Router } from 'express'
import {
  addToCartController,
  applyCouponController,
  clearCartController,
  getCartController,
  removeCouponController,
  removeFromCartController,
  updateCartItemController
} from '../controllers/carts.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { addToCartValidator, applyCouponValidator, updateCartItemValidator } from '../middlewares/cart.middlewares'
import { wrapAsync } from '../utils/handler'

const cartRouter = Router()

// All cart routes require authentication
cartRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Get user's cart
 * @route GET /cart
 * @access Private
 */
cartRouter.get('/', wrapAsync(getCartController))

/**
 * @description Add item to cart
 * @route POST /cart
 * @access Private
 */
cartRouter.post('/', addToCartValidator, wrapAsync(addToCartController))

/**
 * @description Update cart item quantity or selected status
 * @route PUT /cart/:product_id
 * @access Private
 */
cartRouter.put('/:product_id', updateCartItemValidator, wrapAsync(updateCartItemController))

/**
 * @description Remove item from cart
 * @route DELETE /cart/:product_id
 * @access Private
 */
cartRouter.delete('/:product_id', wrapAsync(removeFromCartController))

/**
 * @description Clear cart
 * @route DELETE /cart
 * @access Private
 */
cartRouter.delete('/', wrapAsync(clearCartController))

/**
 * @description Apply coupon to cart
 * @route POST /cart/coupon
 * @access Private
 */
cartRouter.post('/coupon', applyCouponValidator, wrapAsync(applyCouponController))

/**
 * @description Remove coupon from cart
 * @route DELETE /cart/coupon
 * @access Private
 */
cartRouter.delete('/coupon', wrapAsync(removeCouponController))

export default cartRouter
