import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { UpdateAddressReqBody } from '../models/request/Address.request'
import Address from '~/models/schemas/Address.chema'
import geocodingService from './geocoding.services'

class AddressService {
  async createAddress({
    user_id,
    name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    is_default = false,
    latitude,
    longitude,
    formatted_address
  }: {
    user_id: string
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
  }) {
    // Nếu đặt làm mặc định, hủy bỏ mặc định của các địa chỉ khác
    if (is_default) {
      await databaseService.addresses.updateMany(
        { user_id: new ObjectId(user_id), is_default: true },
        { $set: { is_default: false, updated_at: new Date() } }
      )
    } else {
      // Kiểm tra nếu đây là địa chỉ đầu tiên, thì đặt làm mặc định
      const count = await databaseService.addresses.countDocuments({
        user_id: new ObjectId(user_id)
      })

      if (count === 0) {
        is_default = true
      }
    }

    // Tạo chuỗi địa chỉ đầy đủ nếu không được cung cấp
    if (!formatted_address) {
      formatted_address = `${address_line1}, ${city}, ${state}, ${postal_code}, ${country}`
    }

    // Tạo location nếu có tọa độ
    let location
    if (latitude !== undefined && longitude !== undefined) {
      location = {
        type: 'Point',
        coordinates: [longitude, latitude] // MongoDB sử dụng [longitude, latitude]
      }
    }

    // Tạo bản ghi địa chỉ mới
    const address = new Address({
      user_id: new ObjectId(user_id),
      name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default,
      location: location as any,
      formatted_address
    })

    const result = await databaseService.addresses.insertOne(address)

    return { ...address, _id: result.insertedId }
  }

  // Giữ các phương thức địa lý
  async findNearbyAddresses(latitude: number, longitude: number, maxDistance: number = 10000) {
    // Find addresses within the specified distance (in meters)
    return databaseService.addresses
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: maxDistance
          }
        }
      })
      .toArray()
  }

  async estimateDeliveryTime(originLat: number, originLng: number, destLat: number, destLng: number) {
    // Calculate distance
    const distanceKm = geocodingService.calculateDistance(originLat, originLng, destLat, destLng)

    // Simple estimation based on distance
    let minDays = 1
    let maxDays = 2

    if (distanceKm > 20 && distanceKm <= 100) {
      minDays = 2
      maxDays = 3
    } else if (distanceKm > 100 && distanceKm <= 500) {
      minDays = 3
      maxDays = 5
    } else if (distanceKm > 500) {
      minDays = 5
      maxDays = 10
    }

    return {
      distance_km: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
      estimated_delivery_days: {
        min: minDays,
        max: maxDays
      }
    }
  }

  async updateAddress(address_id: string, payload: UpdateAddressReqBody) {
    const updateData: any = {}

    // Only include fields that are provided in the payload
    if (payload.name !== undefined) updateData.name = payload.name
    if (payload.phone !== undefined) updateData.phone = payload.phone
    if (payload.address_line1 !== undefined) updateData.address_line1 = payload.address_line1
    if (payload.address_line2 !== undefined) updateData.address_line2 = payload.address_line2
    if (payload.city !== undefined) updateData.city = payload.city
    if (payload.state !== undefined) updateData.state = payload.state
    if (payload.postal_code !== undefined) updateData.postal_code = payload.postal_code
    if (payload.country !== undefined) updateData.country = payload.country
    if (payload.is_default !== undefined) updateData.is_default = payload.is_default

    // Add updated_at timestamp
    updateData.updated_at = new Date()

    await databaseService.addresses.findOneAndUpdate({ _id: new ObjectId(address_id) }, { $set: updateData })

    return this.getAddressById(address_id)
  }

  async getAddressById(address_id: string) {
    return databaseService.addresses.findOne({ _id: new ObjectId(address_id) })
  }

  async deleteAddress(address_id: string) {
    return databaseService.addresses.deleteOne({ _id: new ObjectId(address_id) })
  }

  async getUserAddresses(user_id: string) {
    return databaseService.addresses
      .find({
        user_id: new ObjectId(user_id)
      })
      .toArray()
  }

  async getUserAddressesWithPagination(user_id: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    // Get total count
    const total = await databaseService.addresses.countDocuments({
      user_id: new ObjectId(user_id)
    })

    // Get addresses
    const addresses = await databaseService.addresses
      .find({ user_id: new ObjectId(user_id) })
      .sort({ is_default: -1, created_at: -1 }) // Default address first, then newest
      .skip(skip)
      .limit(limit)
      .toArray()

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      addresses,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async getDefaultAddress(user_id: string) {
    return databaseService.addresses.findOne({
      user_id: new ObjectId(user_id),
      is_default: true
    })
  }

  async updateAllAddressesDefault(user_id: string, is_default: boolean) {
    return databaseService.addresses.updateMany(
      { user_id: new ObjectId(user_id) },
      { $set: { is_default, updated_at: new Date() } }
    )
  }

  async setDefaultAddress(user_id: string, address_id: string) {
    // First, set all user addresses to not default
    await this.updateAllAddressesDefault(user_id, false)

    // Then set the specified address as default
    await this.updateAddress(address_id, { is_default: true })

    return this.getAddressById(address_id)
  }

  async validateAddress(address: {
    address_line1: string
    city: string
    state: string
    postal_code: string
    country: string
  }) {
    // This would typically integrate with a third-party address validation service
    // Here we'll just do some basic validation

    // Check required fields
    if (!address.address_line1 || !address.city || !address.state || !address.postal_code || !address.country) {
      return {
        valid: false,
        message: 'All address fields are required'
      }
    }

    // Simple postal code format validation (this is very simplified)
    const postalCodePattern = /^[0-9]{5}(-[0-9]{4})?$/
    if (!postalCodePattern.test(address.postal_code)) {
      return {
        valid: false,
        message: 'Invalid postal code format'
      }
    }

    // In a real application, you would check against a database of valid cities, states, etc.
    // or use a third-party API for address validation

    return {
      valid: true,
      message: 'Address is valid'
    }
  }
}

const addressService = new AddressService()
export default addressService
