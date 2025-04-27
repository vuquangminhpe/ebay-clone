/* eslint-disable @typescript-eslint/no-explicit-any */
import { Address, CreateAddressRequest, SetDefaultAddressRequest, UpdateAddressRequest } from '@/types/Address.type'
import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

/**
 * API client for user address management
 * Accessible by: Authenticated users only
 */
export const AddressApi = {
  /**
   * Get user's addresses
   * @access Private - Any authenticated user
   */
  getUserAddresses: (params?: { page?: number; limit?: number }) =>
    http.get<SuccessResponse<{ message: string; result: { addresses: Address[]; pagination: any } }>>('/addresses', {
      params
    }),

  /**
   * Create a new address
   * @access Private - Any authenticated user
   */
  createAddress: (params: CreateAddressRequest) =>
    http.post<SuccessResponse<{ message: string; result: Address }>>('/addresses', params),

  /**
   * Get an address by ID
   * @access Private - Owner of address only
   */
  getAddress: (address_id: string) =>
    http.get<SuccessResponse<{ message: string; result: Address }>>(`/addresses/${address_id}`),

  /**
   * Update an address
   * @access Private - Owner of address only
   */
  updateAddress: (address_id: string, params: UpdateAddressRequest) =>
    http.put<SuccessResponse<{ message: string; result: Address }>>(`/addresses/${address_id}`, params),

  /**
   * Delete an address
   * @access Private - Owner of address only
   */
  deleteAddress: (address_id: string) => http.delete<SuccessResponse<{ message: string }>>(`/addresses/${address_id}`),

  /**
   * Set an address as default
   * @access Private - Any authenticated user
   */
  setDefaultAddress: (params: SetDefaultAddressRequest) =>
    http.post<SuccessResponse<{ message: string }>>('/addresses/default', params),

  /**
   * Find addresses near a location
   * @access Private - Any authenticated user
   */
  findNearbyAddresses: (params: {
    latitude: number
    longitude: number
    radius?: number // in meters, default is 10000 (10km)
  }) => http.get<SuccessResponse<{ message: string; result: Address[] }>>('/addresses/nearby', { params }),

  /**
   * Validate an address
   * @access Private - Any authenticated user
   */
  validateAddress: (address: {
    address_line1: string
    city: string
    state: string
    postal_code: string
    country: string
  }) => http.post<SuccessResponse<{ valid: boolean; message: string }>>('/addresses/validate', address)
}
