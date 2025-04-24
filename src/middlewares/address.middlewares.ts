// src/middlewares/address.middlewares.ts
import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { ObjectId } from 'mongodb'

export const createAddressValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: 'Name is required'
        },
        isString: {
          errorMessage: 'Name must be a string'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'Name must be between 2 and 100 characters'
        },
        trim: true
      },
      phone: {
        notEmpty: {
          errorMessage: 'Phone number is required'
        },
        isString: {
          errorMessage: 'Phone must be a string'
        },
        trim: true
      },
      address_line1: {
        notEmpty: {
          errorMessage: 'Address line 1 is required'
        },
        isString: {
          errorMessage: 'Address line 1 must be a string'
        },
        isLength: {
          options: { min: 5, max: 200 },
          errorMessage: 'Address line 1 must be between 5 and 200 characters'
        },
        trim: true
      },
      address_line2: {
        optional: true,
        isString: {
          errorMessage: 'Address line 2 must be a string'
        },
        isLength: {
          options: { max: 200 },
          errorMessage: 'Address line 2 must be less than 200 characters'
        },
        trim: true
      },
      city: {
        notEmpty: {
          errorMessage: 'City is required'
        },
        isString: {
          errorMessage: 'City must be a string'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'City must be between 2 and 100 characters'
        },
        trim: true
      },
      state: {
        notEmpty: {
          errorMessage: 'State is required'
        },
        isString: {
          errorMessage: 'State must be a string'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'State must be between 2 and 100 characters'
        },
        trim: true
      },
      postal_code: {
        notEmpty: {
          errorMessage: 'Postal code is required'
        },
        isString: {
          errorMessage: 'Postal code must be a string'
        },
        trim: true
      },
      country: {
        notEmpty: {
          errorMessage: 'Country is required'
        },
        isString: {
          errorMessage: 'Country must be a string'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'Country must be between 2 and 100 characters'
        },
        trim: true
      },
      is_default: {
        optional: true,
        isBoolean: {
          errorMessage: 'Default status must be a boolean value'
        }
      }
    },
    ['body']
  )
)

export const updateAddressValidator = validate(
  checkSchema(
    {
      address_id: {
        in: ['params'],
        notEmpty: {
          errorMessage: 'Address ID is required'
        },
        isString: {
          errorMessage: 'Address ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid address ID format')
            }
            return true
          }
        }
      },
      name: {
        optional: true,
        isString: {
          errorMessage: 'Name must be a string'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'Name must be between 2 and 100 characters'
        },
        trim: true
      },
      phone: {
        optional: true,
        isString: {
          errorMessage: 'Phone must be a string'
        },
        trim: true
      },
      address_line1: {
        optional: true,
        isString: {
          errorMessage: 'Address line 1 must be a string'
        },
        isLength: {
          options: { min: 5, max: 200 },
          errorMessage: 'Address line 1 must be between 5 and 200 characters'
        },
        trim: true
      },
      address_line2: {
        optional: true,
        isString: {
          errorMessage: 'Address line 2 must be a string'
        },
        isLength: {
          options: { max: 200 },
          errorMessage: 'Address line 2 must be less than 200 characters'
        },
        trim: true
      },
      city: {
        optional: true,
        isString: {
          errorMessage: 'City must be a string'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'City must be between 2 and 100 characters'
        },
        trim: true
      },
      state: {
        optional: true,
        isString: {
          errorMessage: 'State must be a string'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'State must be between 2 and 100 characters'
        },
        trim: true
      },
      postal_code: {
        optional: true,
        isString: {
          errorMessage: 'Postal code must be a string'
        },
        trim: true
      },
      country: {
        optional: true,
        isString: {
          errorMessage: 'Country must be a string'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'Country must be between 2 and 100 characters'
        },
        trim: true
      },
      is_default: {
        optional: true,
        isBoolean: {
          errorMessage: 'Default status must be a boolean value'
        }
      }
    },
    ['params', 'body']
  )
)

export const setDefaultAddressValidator = validate(
  checkSchema(
    {
      address_id: {
        notEmpty: {
          errorMessage: 'Address ID is required'
        },
        isString: {
          errorMessage: 'Address ID must be a string'
        },
        custom: {
          options: (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid address ID format')
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
