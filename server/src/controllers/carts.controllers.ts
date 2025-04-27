import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { CART_MESSAGE, PRODUCT_MESSAGE } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import {
  AddToCartReqBody,
  ApplyCouponReqBody,
  CartItemParams,
  UpdateCartItemReqBody
} from '../models/request/Cart.request'
import cartService from '../services/carts.services'
import productService from '../services/products.services'
import couponService from '../services/coupon.services'

export const getCartController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const cart = await cartService.getCart(user_id)

  return res.status(HTTP_STATUS.OK).json({
    message: CART_MESSAGE.GET_CART_SUCCESS,
    result: cart
  })
}

export const addToCartController = async (req: Request<ParamsDictionary, any, AddToCartReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { product_id, quantity, variant_id } = req.body

  // Validate product exists
  const product = await productService.getProductById(product_id)
  if (!product) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCT_MESSAGE.PRODUCT_NOT_FOUND
    })
  }

  // Validate product is active
  if (product.status !== 'active') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: PRODUCT_MESSAGE.PRODUCT_NOT_FOUND
    })
  }

  // Check if product has sufficient stock
  let availableStock = product.quantity

  // If variant is specified, check variant stock instead
  if (variant_id && product.variants) {
    const variant = product.variants.find((v) => v._id?.toString() === variant_id)
    if (!variant) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Product variant not found'
      })
    }
    availableStock = variant.stock
  }

  if (quantity > availableStock) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: PRODUCT_MESSAGE.INSUFFICIENT_STOCK
    })
  }

  // Add to cart
  const result = await cartService.addToCart(user_id, {
    product_id: new ObjectId(product_id),
    quantity,
    price: product.price,
    variant_id: variant_id ? new ObjectId(variant_id) : undefined,
    selected: true
  })

  return res.status(HTTP_STATUS.OK).json({
    message: CART_MESSAGE.ADD_TO_CART_SUCCESS,
    result
  })
}

export const updateCartItemController = async (
  req: Request<CartItemParams, any, UpdateCartItemReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { product_id } = req.params
  const { quantity, selected } = req.body

  // Validate product exists
  const product = await productService.getProductById(product_id)
  if (!product) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCT_MESSAGE.PRODUCT_NOT_FOUND
    })
  }

  // Get current cart
  const cart = await cartService.getCart(user_id)
  if (!cart) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: CART_MESSAGE.CART_NOT_FOUND
    })
  }
  // Check if product is in cart
  const cartItem = (cart.items as any).find((item: any) => item.product_id.toString() === product_id)
  if (!cartItem) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: CART_MESSAGE.PRODUCT_NOT_IN_CART
    })
  }

  // Check if variant exists if cart item has variant
  if (cartItem.variant_id) {
    const variant = product.variants?.find((v) => v._id?.toString() === cartItem.variant_id?.toString())
    if (!variant) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Product variant not found'
      })
    }

    // Check if requested quantity is available
    if (quantity !== undefined && quantity > variant.stock) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: PRODUCT_MESSAGE.INSUFFICIENT_STOCK
      })
    }
  } else if (quantity !== undefined && quantity > product.quantity) {
    // Check if requested quantity is available for product without variant
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: PRODUCT_MESSAGE.INSUFFICIENT_STOCK
    })
  }

  // Update cart item
  const result = await cartService.updateCartItem(user_id, product_id, {
    quantity,
    selected
  })

  return res.status(HTTP_STATUS.OK).json({
    message: CART_MESSAGE.UPDATE_CART_SUCCESS,
    result
  })
}

export const removeFromCartController = async (req: Request<CartItemParams>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { product_id } = req.params

  // Remove from cart
  await cartService.removeFromCart(user_id, product_id)

  return res.status(HTTP_STATUS.OK).json({
    message: CART_MESSAGE.REMOVE_FROM_CART_SUCCESS
  })
}

export const clearCartController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  // Clear cart
  await cartService.clearCart(user_id)

  return res.status(HTTP_STATUS.OK).json({
    message: CART_MESSAGE.CLEAR_CART_SUCCESS
  })
}

export const applyCouponController = async (req: Request<ParamsDictionary, any, ApplyCouponReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { coupon_code } = req.body

  // Validate coupon exists and is active
  const coupon = await couponService.getCouponByCode(coupon_code)
  if (!coupon || !coupon.is_active) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: CART_MESSAGE.COUPON_NOT_FOUND
    })
  }

  // Check if coupon is expired
  const now = new Date()
  if (now < coupon.starts_at || now > coupon.expires_at) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: CART_MESSAGE.COUPON_EXPIRED
    })
  }

  // Check if coupon has reached usage limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: CART_MESSAGE.COUPON_USAGE_LIMIT_REACHED
    })
  }

  // Get cart
  const cart = await cartService.getCart(user_id)
  if (!cart) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: CART_MESSAGE.CART_NOT_FOUND
    })
  }
  // Calculate cart total for selected items
  const selectedItems = (cart.items as any).filter((item: any) => item.selected)
  if (selectedItems.length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: CART_MESSAGE.CART_IS_EMPTY
    })
  }

  const subtotal = selectedItems.reduce((total: number, item: any) => total + item.price * item.quantity, 0)

  // Check min purchase requirement
  if (coupon.min_purchase && subtotal < coupon.min_purchase) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: CART_MESSAGE.MINIMUM_PURCHASE_NOT_MET
    })
  }

  // Check coupon applicability
  if (coupon.applicability !== 'all_products') {
    let isApplicable = false

    if (coupon.applicability === 'specific_products' && coupon.product_ids) {
      // Check if cart has any of the specific products
      isApplicable = selectedItems.some((item: { product_id: { toString: () => string } }) =>
        coupon.product_ids?.some((pid) => pid.toString() === item.product_id.toString())
      )
    } else if (coupon.applicability === 'specific_categories' && coupon.category_ids) {
      // Get product details for all cart items
      const productIds = selectedItems.map((item: { product_id: any }) => item.product_id)
      const products = await productService.getProductsByIds(productIds)

      // Check if any product belongs to the specified categories
      isApplicable = products.some((product) =>
        coupon.category_ids?.some((cid) => cid.toString() === product.category_id.toString())
      )
    }

    if (!isApplicable) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: CART_MESSAGE.COUPON_NOT_APPLICABLE
      })
    }
  }

  // Apply coupon to cart
  await cartService.applyCoupon(user_id, coupon_code)

  // Calculate discount amount
  let discountAmount = 0
  if (coupon.type === ('percentage' as any)) {
    discountAmount = subtotal * (coupon.value / 100)
    // Apply max discount if specified
    if (coupon.max_discount && discountAmount > coupon.max_discount) {
      discountAmount = coupon.max_discount
    }
  } else {
    // fixed amount
    discountAmount = coupon.value
    // Don't exceed subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal
    }
  }

  return res.status(HTTP_STATUS.OK).json({
    message: CART_MESSAGE.COUPON_APPLIED_SUCCESS,
    result: {
      coupon_code,
      discount_amount: discountAmount,
      subtotal_before_discount: subtotal,
      subtotal_after_discount: subtotal - discountAmount
    }
  })
}

export const removeCouponController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  // Remove coupon from cart
  await cartService.removeCoupon(user_id)

  return res.status(HTTP_STATUS.OK).json({
    message: CART_MESSAGE.COUPON_REMOVED_SUCCESS
  })
}
