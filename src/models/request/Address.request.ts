import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface CreateAddressReqBody {
  name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default?: boolean
  location?: {
    type: string
    coordinates: [number, number]
  }
  formatted_address?: string
}

export interface UpdateAddressReqBody {
  name?: string
  phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  is_default?: boolean
}

export interface AddressParams extends ParamsDictionary {
  address_id: string
}

export interface AddressQuery extends Query {
  page?: string
  limit?: string
}

export interface SetDefaultAddressReqBody {
  address_id: string
}
