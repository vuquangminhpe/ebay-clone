// src/middlewares/order.middlewares.ts
import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { ObjectId } from 'mongodb'
import { PaymentMethod } from '../constants/enums'

export const createOrderValidator = validate(
  checkSchema(
    {
      shipping_address_id: {
        notEmpty: {
          errorMessage: 'Shipping address ID is required'
        },
        isString: {
          errorMessage: 'Shipping address ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid shipping address ID format')
            }
            return true
          }
        }
      },
      payment_method: {
        notEmpty: {
          errorMessage: 'Payment method is required'
        },
        isIn: {
          options: [Object.values(PaymentMethod)],
          errorMessage: `Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`
        }
      },
      coupon_code: {
        optional: true,
        isString: {
          errorMessage: 'Coupon code must be a string'
        },
        trim: true
      },
      notes: {
        optional: true,
        isString: {
          errorMessage: 'Notes must be a string'
        },
        isLength: {
          options: { max: 500 },
          errorMessage: 'Notes must be less than 500 characters'
        },
        trim: true
      }
    },
    ['body']
  )
)

export const cancelOrderValidator = validate(
  checkSchema(
    {
      order_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: 'Order ID is required'
        },
        isString: {
          errorMessage: 'Order ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid order ID format')
            }
            return true
          }
        }
      },
      reason: {
        optional: true,
        isString: {
          errorMessage: 'Reason must be a string'
        },
        isLength: {
          options: { max: 500 },
          errorMessage: 'Reason must be less than 500 characters'
        },
        trim: true
      }
    },
    ['params', 'body']
  )
)

export const payOrderValidator = validate(
  checkSchema(
    {
      order_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: 'Order ID is required'
        },
        isString: {
          errorMessage: 'Order ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid order ID format')
            }
            return true
          }
        }
      },
      payment_method: {
        notEmpty: {
          errorMessage: 'Payment method is required'
        },
        isIn: {
          options: [Object.values(PaymentMethod)],
          errorMessage: `Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`
        }
      },
      payment_details: {
        optional: true,
        isObject: {
          errorMessage: 'Payment details must be an object'
        }
      }
    },
    ['params', 'body']
  )
)

export const shipOrderValidator = validate(
  checkSchema(
    {
      order_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: 'Order ID is required'
        },
        isString: {
          errorMessage: 'Order ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid order ID format')
            }
            return true
          }
        }
      },
      tracking_number: {
        notEmpty: {
          errorMessage: 'Tracking number is required'
        },
        isString: {
          errorMessage: 'Tracking number must be a string'
        },
        trim: true
      },
      shipping_provider: {
        optional: true,
        isString: {
          errorMessage: 'Shipping provider must be a string'
        },
        trim: true
      },
      estimated_delivery_date: {
        optional: true,
        isISO8601: {
          errorMessage: 'Estimated delivery date must be a valid ISO 8601 date'
        }
      }
    },
    ['params', 'body']
  )
)

export const deliverOrderValidator = validate(
  checkSchema(
    {
      order_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: 'Order ID is required'
        },
        isString: {
          errorMessage: 'Order ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid order ID format')
            }
            return true
          }
        }
      },
      delivery_notes: {
        optional: true,
        isString: {
          errorMessage: 'Delivery notes must be a string'
        },
        isLength: {
          options: { max: 500 },
          errorMessage: 'Delivery notes must be less than 500 characters'
        },
        trim: true
      }
    },
    ['params', 'body']
  )
)
