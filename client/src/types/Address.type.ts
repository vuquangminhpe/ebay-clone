export interface Address {
  _id: string
  user_id: string
  name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  location?: {
    type: string
    coordinates: number[]
  }
  latitude?: number
  longitude?: number
  formatted_address: string
  created_at: string
  updated_at: string
}

export interface CreateAddressRequest {
  name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default?: boolean
  latitude?: number
  longitude?: number
  formatted_address?: string
  user_id?: string
}

export interface UpdateAddressRequest {
  name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  latitude?: number
  longitude?: number
}

export interface SetDefaultAddressRequest {
  address_id: string
}
