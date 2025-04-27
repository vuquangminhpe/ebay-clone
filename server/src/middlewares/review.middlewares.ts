import { checkSchema } from 'express-validator'
import { REVIEW_MESSAGE } from '../constants/messages'
import { validate } from '../utils/validation'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'

export const createReviewValidator = validate(
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
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid product ID format')
            }

            const product = await databaseService.products.findOne({
              _id: new ObjectId(value)
            })

            if (!product) {
              throw new Error('Product not found')
            }

            return true
          }
        }
      },
      order_id: {
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
      rating: {
        notEmpty: {
          errorMessage: REVIEW_MESSAGE.RATING_IS_REQUIRED
        },
        isInt: {
          options: { min: 1, max: 5 },
          errorMessage: REVIEW_MESSAGE.RATING_MUST_BE_BETWEEN_1_AND_5
        }
      },
      comment: {
        notEmpty: {
          errorMessage: REVIEW_MESSAGE.COMMENT_IS_REQUIRED
        },
        isString: {
          errorMessage: 'Comment must be a string'
        },
        isLength: {
          options: { min: 5, max: 1000 },
          errorMessage: 'Comment must be between 5 and 1000 characters'
        },
        trim: true
      },
      images: {
        optional: true,
        isArray: {
          errorMessage: 'Images must be an array'
        },
        custom: {
          options: (value) => {
            if (Array.isArray(value)) {
              // Validate each image URL
              value.forEach((url) => {
                if (typeof url !== 'string') {
                  throw new Error('Each image must be a string URL')
                }

                try {
                  new URL(url)
                } catch (e) {
                  throw new Error('Invalid image URL format')
                }
              })

              // Limit number of images
              if (value.length > 5) {
                throw new Error('Maximum 5 images allowed')
              }
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const updateReviewValidator = validate(
  checkSchema(
    {
      review_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: 'Review ID is required'
        },
        isString: {
          errorMessage: 'Review ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(REVIEW_MESSAGE.INVALID_REVIEW_ID)
            }
            return true
          }
        }
      },
      rating: {
        optional: true,
        isInt: {
          options: { min: 1, max: 5 },
          errorMessage: REVIEW_MESSAGE.RATING_MUST_BE_BETWEEN_1_AND_5
        }
      },
      comment: {
        optional: true,
        isString: {
          errorMessage: 'Comment must be a string'
        },
        isLength: {
          options: { min: 5, max: 1000 },
          errorMessage: 'Comment must be between 5 and 1000 characters'
        },
        trim: true
      },
      images: {
        optional: true,
        isArray: {
          errorMessage: 'Images must be an array'
        },
        custom: {
          options: (value) => {
            if (Array.isArray(value)) {
              // Validate each image URL
              value.forEach((url) => {
                if (typeof url !== 'string') {
                  throw new Error('Each image must be a string URL')
                }

                try {
                  new URL(url)
                } catch (e) {
                  throw new Error('Invalid image URL format')
                }
              })

              // Limit number of images
              if (value.length > 5) {
                throw new Error('Maximum 5 images allowed')
              }
            }
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)
