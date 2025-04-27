// src/middlewares/coupon.middlewares.ts
import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { ObjectId } from 'mongodb'
import { CouponApplicability, CouponTypes } from '../models/schemas/Coupon.schema'

export const createCouponValidator = validate(
  checkSchema(
    {
      code: {
        notEmpty: {
          errorMessage: 'Coupon code is required'
        },
        isString: {
          errorMessage: 'Coupon code must be a string'
        },
        isLength: {
          options: { min: 3, max: 20 },
          errorMessage: 'Coupon code must be between 3 and 20 characters'
        },
        trim: true,
        custom: {
          options: (value) => {
            // Coupon code should be uppercase alphanumeric with no spaces
            if (!/^[A-Z0-9_-]+$/.test(value)) {
              throw new Error('Coupon code must contain only uppercase letters, numbers, underscores, and hyphens')
            }
            return true
          }
        }
      },
      description: {
        notEmpty: {
          errorMessage: 'Description is required'
        },
        isString: {
          errorMessage: 'Description must be a string'
        },
        isLength: {
          options: { min: 5, max: 200 },
          errorMessage: 'Description must be between 5 and 200 characters'
        },
        trim: true
      },
      type: {
        notEmpty: {
          errorMessage: 'Coupon type is required'
        },
        isIn: {
          options: [Object.values(CouponTypes)],
          errorMessage: `Type must be one of: ${Object.values(CouponTypes).join(', ')}`
        }
      },
      value: {
        notEmpty: {
          errorMessage: 'Coupon value is required'
        },
        isFloat: {
          options: { min: 0.01 },
          errorMessage: 'Value must be greater than 0'
        },
        custom: {
          options: (value, { req }) => {
            // For percentage type, value should be between 0 and 100
            if (req.body.type === 'percentage' && (value < 0 || value > 100)) {
              throw new Error('Percentage value must be between 0 and 100')
            }
            return true
          }
        }
      },
      min_purchase: {
        optional: true,
        isFloat: {
          options: { min: 0 },
          errorMessage: 'Minimum purchase must be a positive number'
        }
      },
      max_discount: {
        optional: true,
        isFloat: {
          options: { min: 0 },
          errorMessage: 'Maximum discount must be a positive number'
        },
        custom: {
          options: (value, { req }) => {
            // Max discount only applies to percentage coupons
            if (req.body.type !== 'percentage' && value !== undefined) {
              throw new Error('Maximum discount only applies to percentage type coupons')
            }
            return true
          }
        }
      },
      applicability: {
        notEmpty: {
          errorMessage: 'Applicability is required'
        },
        isIn: {
          options: [Object.values(CouponApplicability)],
          errorMessage: `Applicability must be one of: ${Object.values(CouponApplicability).join(', ')}`
        }
      },
      product_ids: {
        optional: true,
        isArray: {
          errorMessage: 'Product IDs must be an array'
        },
        custom: {
          options: (value, { req }) => {
            // Product IDs are only required for specific_products applicability
            if (req.body.applicability === 'specific_products' && (!value || value.length === 0)) {
              throw new Error('Product IDs are required for specific_products applicability')
            }

            // Validate each product ID
            if (value && value.length > 0) {
              for (const id of value) {
                if (!ObjectId.isValid(id)) {
                  throw new Error('Invalid product ID format')
                }
              }
            }

            return true
          }
        }
      },
      category_ids: {
        optional: true,
        isArray: {
          errorMessage: 'Category IDs must be an array'
        },
        custom: {
          options: (value, { req }) => {
            // Category IDs are only required for specific_categories applicability
            if (req.body.applicability === 'specific_categories' && (!value || value.length === 0)) {
              throw new Error('Category IDs are required for specific_categories applicability')
            }

            // Validate each category ID
            if (value && value.length > 0) {
              for (const id of value) {
                if (!ObjectId.isValid(id)) {
                  throw new Error('Invalid category ID format')
                }
              }
            }

            return true
          }
        }
      },
      usage_limit: {
        optional: true,
        isInt: {
          options: { min: 1 },
          errorMessage: 'Usage limit must be a positive integer'
        }
      },
      starts_at: {
        notEmpty: {
          errorMessage: 'Start date is required'
        },
        isISO8601: {
          errorMessage: 'Start date must be a valid ISO8601 date'
        }
      },
      expires_at: {
        notEmpty: {
          errorMessage: 'Expiry date is required'
        },
        isISO8601: {
          errorMessage: 'Expiry date must be a valid ISO8601 date'
        },
        custom: {
          options: (value, { req }) => {
            // Expiry date must be after start date
            if (new Date(value) <= new Date(req.body.starts_at)) {
              throw new Error('Expiry date must be after start date')
            }
            return true
          }
        }
      },
      is_active: {
        optional: true,
        isBoolean: {
          errorMessage: 'Active status must be a boolean value'
        }
      }
    },
    ['body']
  )
)

export const updateCouponValidator = validate(
  checkSchema(
    {
      coupon_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: 'Coupon ID is required'
        },
        isString: {
          errorMessage: 'Coupon ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid coupon ID format')
            }
            return true
          }
        }
      },
      description: {
        optional: true,
        isString: {
          errorMessage: 'Description must be a string'
        },
        isLength: {
          options: { min: 5, max: 200 },
          errorMessage: 'Description must be between 5 and 200 characters'
        },
        trim: true
      },
      type: {
        optional: true,
        isIn: {
          options: [Object.values(CouponTypes)],
          errorMessage: `Type must be one of: ${Object.values(CouponTypes).join(', ')}`
        }
      },
      value: {
        optional: true,
        isFloat: {
          options: { min: 0.01 },
          errorMessage: 'Value must be greater than 0'
        },
        custom: {
          options: (value, { req }) => {
            // For percentage type, value should be between 0 and 100
            if (req.body.type === 'percentage' && (value < 0 || value > 100)) {
              throw new Error('Percentage value must be between 0 and 100')
            }
            return true
          }
        }
      },
      min_purchase: {
        optional: true,
        custom: {
          options: (value) => {
            if (value === null) return true

            if (typeof value === 'number' && value >= 0) return true

            throw new Error('Minimum purchase must be a positive number or null')
          }
        }
      },
      max_discount: {
        optional: true,
        custom: {
          options: (value, { req }) => {
            if (value === null) return true

            if (typeof value !== 'number' || value < 0) {
              throw new Error('Maximum discount must be a positive number or null')
            }

            // Max discount only applies to percentage coupons
            if (req.body.type !== 'percentage' && req.body.type !== undefined && value !== null) {
              throw new Error('Maximum discount only applies to percentage type coupons')
            }

            return true
          }
        }
      },
      applicability: {
        optional: true,
        isIn: {
          options: [Object.values(CouponApplicability)],
          errorMessage: `Applicability must be one of: ${Object.values(CouponApplicability).join(', ')}`
        }
      },
      product_ids: {
        optional: true,
        custom: {
          options: (value, { req }) => {
            // Allow null to remove all product IDs
            if (value === null) return true

            // Validate array
            if (!Array.isArray(value)) {
              throw new Error('Product IDs must be an array or null')
            }

            // Product IDs are only required for specific_products applicability
            if (req.body.applicability === 'specific_products' && value.length === 0) {
              throw new Error('Product IDs are required for specific_products applicability')
            }

            // Validate each product ID
            for (const id of value) {
              if (!ObjectId.isValid(id)) {
                throw new Error('Invalid product ID format')
              }
            }

            return true
          }
        }
      },
      category_ids: {
        optional: true,
        custom: {
          options: (value, { req }) => {
            // Allow null to remove all category IDs
            if (value === null) return true

            // Validate array
            if (!Array.isArray(value)) {
              throw new Error('Category IDs must be an array or null')
            }

            // Category IDs are only required for specific_categories applicability
            if (req.body.applicability === 'specific_categories' && value.length === 0) {
              throw new Error('Category IDs are required for specific_categories applicability')
            }

            // Validate each category ID
            for (const id of value) {
              if (!ObjectId.isValid(id)) {
                throw new Error('Invalid category ID format')
              }
            }

            return true
          }
        }
      },
      usage_limit: {
        optional: true,
        custom: {
          options: (value) => {
            if (value === null) return true

            if (Number.isInteger(value) && value > 0) return true

            throw new Error('Usage limit must be a positive integer or null')
          }
        }
      },
      starts_at: {
        optional: true,
        isISO8601: {
          errorMessage: 'Start date must be a valid ISO8601 date'
        }
      },
      expires_at: {
        optional: true,
        isISO8601: {
          errorMessage: 'Expiry date must be a valid ISO8601 date'
        },
        custom: {
          options: (value, { req }) => {
            // If updating expiry date, it must be after start date
            if (req.body.starts_at) {
              if (new Date(value) <= new Date(req.body.starts_at)) {
                throw new Error('Expiry date must be after start date')
              }
            }
            return true
          }
        }
      },
      is_active: {
        optional: true,
        isBoolean: {
          errorMessage: 'Active status must be a boolean value'
        }
      }
    },
    ['params', 'body']
  )
)
