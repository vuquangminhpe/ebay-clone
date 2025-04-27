import { checkSchema } from 'express-validator'
import { CATEGORY_MESSAGE } from '../constants/messages'
import { validate } from '../utils/validation'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'

export const createCategoryValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: CATEGORY_MESSAGE.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: 'Category name must be a string'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'Category name must be between 2 and 100 characters'
        },
        trim: true
      },
      description: {
        optional: true,
        isString: {
          errorMessage: 'Category description must be a string'
        },
        isLength: {
          options: { max: 1000 },
          errorMessage: 'Category description must be less than 1000 characters'
        },
        trim: true
      },
      parent_id: {
        optional: true,
        isString: {
          errorMessage: 'Parent category ID must be a string'
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid parent category ID format')
            }

            const parentCategory = await databaseService.categories.findOne({
              _id: new ObjectId(value)
            })

            if (!parentCategory) {
              throw new Error('Parent category not found')
            }

            return true
          }
        }
      },
      image_url: {
        optional: true,
        isURL: {
          errorMessage: 'Image URL must be a valid URL'
        }
      }
    },
    ['body']
  )
)

export const updateCategoryValidator = validate(
  checkSchema(
    {
      category_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: 'Category ID is required'
        },
        isString: {
          errorMessage: 'Category ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(CATEGORY_MESSAGE.INVALID_CATEGORY_ID)
            }
            return true
          }
        }
      },
      name: {
        optional: true,
        isString: {
          errorMessage: 'Category name must be a string'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'Category name must be between 2 and 100 characters'
        },
        trim: true
      },
      description: {
        optional: true,
        isString: {
          errorMessage: 'Category description must be a string'
        },
        isLength: {
          options: { max: 1000 },
          errorMessage: 'Category description must be less than 1000 characters'
        },
        trim: true
      },
      parent_id: {
        optional: true,
        custom: {
          options: async (value) => {
            // Allow null to remove parent
            if (value === null) {
              return true
            }

            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid parent category ID format')
            }

            const parentCategory = await databaseService.categories.findOne({
              _id: new ObjectId(value)
            })

            if (!parentCategory) {
              throw new Error('Parent category not found')
            }

            return true
          }
        }
      },
      image_url: {
        optional: true,
        isURL: {
          errorMessage: 'Image URL must be a valid URL'
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
