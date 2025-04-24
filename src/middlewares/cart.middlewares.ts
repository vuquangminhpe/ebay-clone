// src/middlewares/cart.middlewares.ts
import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { ObjectId } from 'mongodb'

export const addToCartValidator = validate(
  checkSchema(
    {
      product_id: {
        notEmpty: {
          errorMessage: 'Product ID is required'
        },
        isString: {
          errorMessage: 'Product ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid product ID format')
            }
            return true
          }
        }
      },
      quantity: {
        notEmpty: {
          errorMessage: 'Quantity is required'
        },
        isInt: {
          options: { min: 1 },
          errorMessage: 'Quantity must be a positive integer'
        }
      },
      variant_id: {
        optional: true,
        isString: {
          errorMessage: 'Variant ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid variant ID format')
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const updateCartItemValidator = validate(
  checkSchema(
    {
      product_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: 'Product ID is required'
        },
        isString: {
          errorMessage: 'Product ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid product ID format')
            }
            return true
          }
        }
      },
      quantity: {
        optional: true,
        isInt: {
          options: { min: 1 },
          errorMessage: 'Quantity must be a positive integer'
        }
      },
      selected: {
        optional: true,
        isBoolean: {
          errorMessage: 'Selected status must be a boolean value'
        }
      }
    },
    ['params', 'body']
  )
)

export const applyCouponValidator = validate(
  checkSchema(
    {
      coupon_code: {
        notEmpty: {
          errorMessage: 'Coupon code is required'
        },
        isString: {
          errorMessage: 'Coupon code must be a string'
        },
        trim: true
      }
    },
    ['body']
  )
)
