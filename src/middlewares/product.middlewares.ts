import { checkSchema } from 'express-validator'
import { ProductCondition, ProductStatus } from '../constants/enums'
import { PRODUCT_MESSAGE } from '../constants/messages'
import { validate } from '../utils/validation'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'

export const createProductValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: PRODUCT_MESSAGE.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: 'Product name must be a string'
        },
        isLength: {
          options: { min: 3, max: 200 },
          errorMessage: 'Product name must be between 3 and 200 characters'
        },
        trim: true
      },
      description: {
        notEmpty: {
          errorMessage: PRODUCT_MESSAGE.DESCRIPTION_IS_REQUIRED
        },
        isString: {
          errorMessage: 'Product description must be a string'
        },
        isLength: {
          options: { min: 10, max: 10000 },
          errorMessage: 'Product description must be between 10 and 10000 characters'
        },
        trim: true
      },
      price: {
        notEmpty: {
          errorMessage: PRODUCT_MESSAGE.PRICE_IS_REQUIRED
        },
        isFloat: {
          options: { min: 0.01 },
          errorMessage: PRODUCT_MESSAGE.PRICE_MUST_BE_GREATER_THAN_ZERO
        }
      },
      quantity: {
        notEmpty: {
          errorMessage: PRODUCT_MESSAGE.QUANTITY_IS_REQUIRED
        },
        isInt: {
          options: { min: 1 },
          errorMessage: PRODUCT_MESSAGE.QUANTITY_MUST_BE_GREATER_THAN_ZERO
        }
      },
      category_id: {
        notEmpty: {
          errorMessage: PRODUCT_MESSAGE.CATEGORY_IS_REQUIRED
        },
        isString: {
          errorMessage: 'Category ID must be a string'
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid category ID format')
            }

            const category = await databaseService.categories.findOne({
              _id: new ObjectId(value),
              is_active: true
            })

            if (!category) {
              throw new Error('Category not found or inactive')
            }

            return true
          }
        }
      },
      condition: {
        notEmpty: {
          errorMessage: PRODUCT_MESSAGE.CONDITION_IS_REQUIRED
        },
        isIn: {
          options: [Object.values(ProductCondition)],
          errorMessage: `Condition must be one of: ${Object.values(ProductCondition).join(', ')}`
        }
      },
      medias: {
        notEmpty: {
          errorMessage: PRODUCT_MESSAGE.MEDIA_IS_REQUIRED
        },
        isArray: {
          errorMessage: 'Media must be an array'
        },
        custom: {
          options: (value) => {
            if (!Array.isArray(value) || value.length === 0) {
              throw new Error('At least one media item is required')
            }

            // Validate each media item
            value.forEach((media) => {
              if (!media.url || typeof media.url !== 'string') {
                throw new Error('Each media must have a URL string')
              }

              if (!media.type || typeof media.type !== 'string') {
                throw new Error('Each media must have a type string')
              }

              if (media.is_primary === undefined) {
                throw new Error('Each media must specify is_primary')
              }
            })

            // Check that exactly one media is marked as primary
            const primaryCount = value.filter((media) => media.is_primary).length
            if (primaryCount !== 1) {
              throw new Error('Exactly one media must be marked as primary')
            }

            return true
          }
        }
      },
      tags: {
        optional: true,
        isArray: {
          errorMessage: 'Tags must be an array'
        },
        custom: {
          options: (value) => {
            if (Array.isArray(value)) {
              // Validate each tag
              value.forEach((tag) => {
                if (typeof tag !== 'string') {
                  throw new Error(PRODUCT_MESSAGE.INVALID_TAG_FORMAT)
                }

                if (tag.length < 2 || tag.length > 50) {
                  throw new Error('Each tag must be between 2 and 50 characters')
                }
              })
            }
            return true
          }
        }
      },
      variants: {
        optional: true,
        isArray: {
          errorMessage: 'Variants must be an array'
        },
        custom: {
          options: (value) => {
            if (Array.isArray(value)) {
              // Validate each variant
              value.forEach((variant) => {
                if (!variant.name || typeof variant.name !== 'string') {
                  throw new Error('Each variant must have a name string')
                }

                if (variant.price === undefined || typeof variant.price !== 'number' || variant.price <= 0) {
                  throw new Error('Each variant must have a valid price greater than 0')
                }

                if (variant.stock === undefined || typeof variant.stock !== 'number' || variant.stock < 0) {
                  throw new Error('Each variant must have a valid stock (>=0)')
                }

                if (!variant.attributes || typeof variant.attributes !== 'object') {
                  throw new Error('Each variant must have attributes object')
                }

                // Check attributes
                Object.entries(variant.attributes).forEach(([key, value]) => {
                  if (typeof key !== 'string' || typeof value !== 'string') {
                    throw new Error('Variant attributes must be string key-value pairs')
                  }
                })
              })
            }
            return true
          }
        }
      },
      shipping_price: {
        isFloat: {
          options: { min: 0 },
          errorMessage: 'Shipping price must be a number greater than or equal to 0'
        }
      },
      free_shipping: {
        isBoolean: {
          errorMessage: 'Free shipping must be a boolean value'
        }
      }
    },
    ['body']
  )
)

export const updateProductValidator = validate(
  checkSchema(
    {
      product_id: {
        in: ['params'],
        isString: {
          errorMessage: 'Product ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(PRODUCT_MESSAGE.INVALID_PRODUCT_ID)
            }
            return true
          }
        }
      },
      name: {
        optional: true,
        isString: {
          errorMessage: 'Product name must be a string'
        },
        isLength: {
          options: { min: 3, max: 200 },
          errorMessage: 'Product name must be between 3 and 200 characters'
        },
        trim: true
      },
      description: {
        optional: true,
        isString: {
          errorMessage: 'Product description must be a string'
        },
        isLength: {
          options: { min: 10, max: 10000 },
          errorMessage: 'Product description must be between 10 and 10000 characters'
        },
        trim: true
      },
      price: {
        optional: true,
        isFloat: {
          options: { min: 0.01 },
          errorMessage: PRODUCT_MESSAGE.PRICE_MUST_BE_GREATER_THAN_ZERO
        }
      },
      quantity: {
        optional: true,
        isInt: {
          options: { min: 0 },
          errorMessage: 'Quantity must be zero or greater'
        }
      },
      category_id: {
        optional: true,
        isString: {
          errorMessage: 'Category ID must be a string'
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid category ID format')
            }

            const category = await databaseService.categories.findOne({
              _id: new ObjectId(value),
              is_active: true
            })

            if (!category) {
              throw new Error('Category not found or inactive')
            }

            return true
          }
        }
      },
      condition: {
        optional: true,
        isIn: {
          options: [Object.values(ProductCondition)],
          errorMessage: `Condition must be one of: ${Object.values(ProductCondition).join(', ')}`
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(ProductStatus)],
          errorMessage: `Status must be one of: ${Object.values(ProductStatus).join(', ')}`
        }
      },
      medias: {
        optional: true,
        isArray: {
          errorMessage: 'Media must be an array'
        },
        custom: {
          options: (value) => {
            if (!Array.isArray(value) || value.length === 0) {
              throw new Error('At least one media item is required')
            }

            // Validate each media item
            value.forEach((media) => {
              if (!media.url || typeof media.url !== 'string') {
                throw new Error('Each media must have a URL string')
              }

              if (!media.type || typeof media.type !== 'string') {
                throw new Error('Each media must have a type string')
              }

              if (media.is_primary === undefined) {
                throw new Error('Each media must specify is_primary')
              }
            })

            // Check that exactly one media is marked as primary
            const primaryCount = value.filter((media) => media.is_primary).length
            if (primaryCount !== 1) {
              throw new Error('Exactly one media must be marked as primary')
            }

            return true
          }
        }
      },
      tags: {
        optional: true,
        isArray: {
          errorMessage: 'Tags must be an array'
        },
        custom: {
          options: (value) => {
            if (Array.isArray(value)) {
              // Validate each tag
              value.forEach((tag) => {
                if (typeof tag !== 'string') {
                  throw new Error(PRODUCT_MESSAGE.INVALID_TAG_FORMAT)
                }

                if (tag.length < 2 || tag.length > 50) {
                  throw new Error('Each tag must be between 2 and 50 characters')
                }
              })
            }
            return true
          }
        }
      },
      variants: {
        optional: true,
        isArray: {
          errorMessage: 'Variants must be an array'
        },
        custom: {
          options: (value) => {
            if (Array.isArray(value)) {
              // Validate each variant
              value.forEach((variant) => {
                if (!variant.name || typeof variant.name !== 'string') {
                  throw new Error('Each variant must have a name string')
                }

                if (variant.price === undefined || typeof variant.price !== 'number' || variant.price <= 0) {
                  throw new Error('Each variant must have a valid price greater than 0')
                }

                if (variant.stock === undefined || typeof variant.stock !== 'number' || variant.stock < 0) {
                  throw new Error('Each variant must have a valid stock (>=0)')
                }

                if (!variant.attributes || typeof variant.attributes !== 'object') {
                  throw new Error('Each variant must have attributes object')
                }

                // Check attributes
                Object.entries(variant.attributes).forEach(([key, value]) => {
                  if (typeof key !== 'string' || typeof value !== 'string') {
                    throw new Error('Variant attributes must be string key-value pairs')
                  }
                })
              })
            }
            return true
          }
        }
      },
      shipping_price: {
        optional: true,
        isFloat: {
          options: { min: 0 },
          errorMessage: 'Shipping price must be a number greater than or equal to 0'
        }
      },
      free_shipping: {
        optional: true,
        isBoolean: {
          errorMessage: 'Free shipping must be a boolean value'
        }
      }
    },
    ['params', 'body']
  )
)
