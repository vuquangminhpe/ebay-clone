import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { ADDRESS_MESSAGE } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import {
  AddressParams,
  AddressQuery,
  CreateAddressReqBody,
  SetDefaultAddressReqBody,
  UpdateAddressReqBody
} from '../models/request/Address.request'
import addressService from '../services/address.services'
import userService from '../services/users.services'

export const createAddressController = async (
  req: Request<ParamsDictionary, any, CreateAddressReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await addressService.createAddress({
    ...req.body,
    user_id: new ObjectId(user_id)
  })

  // If this is first address or is_default is true, set as default
  if (req.body.is_default) {
    await userService.updateDefaultAddress(user_id, result._id.toString())
  } else {
    const addresses = await addressService.getUserAddresses(user_id)
    if (addresses.length === 1) {
      await userService.updateDefaultAddress(user_id, result._id.toString())
    }
  }

  return res.status(HTTP_STATUS.CREATED).json({
    message: ADDRESS_MESSAGE.CREATE_ADDRESS_SUCCESS,
    result
  })
}

export const updateAddressController = async (
  req: Request<AddressParams, any, UpdateAddressReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { address_id } = req.params

  // Check if address exists and belongs to user
  const address = await addressService.getAddressById(address_id)
  if (!address) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: ADDRESS_MESSAGE.ADDRESS_NOT_FOUND
    })
  }

  if (address.user_id.toString() !== user_id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: ADDRESS_MESSAGE.UNAUTHORIZED_ADDRESS_ACCESS
    })
  }

  // Update address
  const result = await addressService.updateAddress(address_id, req.body)

  // If is_default is changed to true, update user's default address
  if (req.body.is_default) {
    await userService.updateDefaultAddress(user_id, address_id)
  }

  return res.status(HTTP_STATUS.OK).json({
    message: ADDRESS_MESSAGE.UPDATE_ADDRESS_SUCCESS,
    result
  })
}

export const deleteAddressController = async (req: Request<AddressParams>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { address_id } = req.params

  // Check if address exists and belongs to user
  const address = await addressService.getAddressById(address_id)
  if (!address) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: ADDRESS_MESSAGE.ADDRESS_NOT_FOUND
    })
  }

  if (address.user_id.toString() !== user_id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: ADDRESS_MESSAGE.UNAUTHORIZED_ADDRESS_ACCESS
    })
  }

  // Get user to check if this is the default address
  const user = await userService.getUserById(user_id)
  const isDefault = user?.default_address_id?.toString() === address_id

  // Delete address
  await addressService.deleteAddress(address_id)

  // If this was the default address, set another one as default if available
  if (isDefault) {
    const addresses = await addressService.getUserAddresses(user_id)
    if (addresses.length > 0) {
      await userService.updateDefaultAddress(user_id, addresses[0]._id.toString())
    } else {
      await userService.updateDefaultAddress(user_id, null)
    }
  }

  return res.status(HTTP_STATUS.OK).json({
    message: ADDRESS_MESSAGE.DELETE_ADDRESS_SUCCESS
  })
}

export const getAddressController = async (req: Request<AddressParams>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { address_id } = req.params

  // Check if address exists and belongs to user
  const address = await addressService.getAddressById(address_id)
  if (!address) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: ADDRESS_MESSAGE.ADDRESS_NOT_FOUND
    })
  }

  if (address.user_id.toString() !== user_id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: ADDRESS_MESSAGE.UNAUTHORIZED_ADDRESS_ACCESS
    })
  }

  return res.status(HTTP_STATUS.OK).json({
    message: ADDRESS_MESSAGE.GET_ADDRESS_SUCCESS,
    result: address
  })
}

export const getUserAddressesController = async (
  req: Request<ParamsDictionary, any, any, AddressQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { page = '1', limit = '10' } = req.query

  const result = await addressService.getUserAddressesWithPagination(user_id, parseInt(page), parseInt(limit))

  return res.status(HTTP_STATUS.OK).json({
    message: ADDRESS_MESSAGE.GET_ADDRESSES_SUCCESS,
    result
  })
}

export const setDefaultAddressController = async (
  req: Request<ParamsDictionary, any, SetDefaultAddressReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { address_id } = req.body

  // Check if address exists and belongs to user
  const address = await addressService.getAddressById(address_id)
  if (!address) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: ADDRESS_MESSAGE.ADDRESS_NOT_FOUND
    })
  }

  if (address.user_id.toString() !== user_id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: ADDRESS_MESSAGE.UNAUTHORIZED_ADDRESS_ACCESS
    })
  }

  // Update all user addresses to not be default
  await addressService.updateAllAddressesDefault(user_id, false)

  // Update the specified address to be default
  await addressService.updateAddress(address_id, { is_default: true })

  // Update user's default address
  await userService.updateDefaultAddress(user_id, address_id)

  return res.status(HTTP_STATUS.OK).json({
    message: ADDRESS_MESSAGE.DEFAULT_ADDRESS_SET
  })
}
