import { checkSchema } from 'express-validator'
import { STORE_MESSAGE } from '../constants/messages'
import { validate } from '../utils/validation'
import { ObjectId } from 'mongodb'

export const createStoreValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: STORE_MESSAGE.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: 'Store name must be a string'
        },
        isLength: {
          options: { min: 3, max: 100 },
          errorMessage: 'Store name must be between 3 and 100 characters'
        },
        trim: true
      },
      description: {
        notEmpty: {
          errorMessage: STORE_MESSAGE.DESCRIPTION_IS_REQUIRED
        },
        isString: {
          errorMessage: 'Store description must be a string'
        },
        isLength: {
          options: { min: 10, max: 2000 },
          errorMessage: 'Store description must be between 10 and 2000 characters'
        },
        trim: true
      },
      logo: {
        optional: true,
        isURL: {
          errorMessage: 'Logo must be a valid URL'
        }
      },
      banner: {
        optional: true,
        isURL: {
          errorMessage: 'Banner must be a valid URL'
        }
      },
      policy: {
        optional: true,
        isString: {
          errorMessage: 'Policy must be a string'
        },
        isLength: {
          options: { max: 5000 },
          errorMessage: 'Policy must be less than 5000 characters'
        },
        trim: true
      }
    },
    ['body']
  )
)

export const updateStoreValidator = validate(
  checkSchema(
    {
      name: {
        optional: true,
        isString: {
          errorMessage: 'Store name must be a string'
        },
        isLength: {
          options: { min: 3, max: 100 },
          errorMessage: 'Store name must be between 3 and 100 characters'
        },
        trim: true
      },
      description: {
        optional: true,
        isString: {
          errorMessage: 'Store description must be a string'
        },
        isLength: {
          options: { min: 10, max: 2000 },
          errorMessage: 'Store description must be between 10 and 2000 characters'
        },
        trim: true
      },
      logo: {
        optional: true,
        isURL: {
          errorMessage: 'Logo must be a valid URL'
        }
      },
      banner: {
        optional: true,
        isURL: {
          errorMessage: 'Banner must be a valid URL'
        }
      },
      policy: {
        optional: true,
        isString: {
          errorMessage: 'Policy must be a string'
        },
        isLength: {
          options: { max: 5000 },
          errorMessage: 'Policy must be less than 5000 characters'
        },
        trim: true
      }
    },
    ['body']
  )
)
