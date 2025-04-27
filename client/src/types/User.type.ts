export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  BUYER = 'buyer'
}

export enum UserVerifyStatus {
  Unverified = 0,
  Verified = 1,
  Banned = 2
}

export interface User {
  _id: string
  name: string
  email: string
  username: string
  date_of_birth: string
  avatar?: string
  cover_photo?: string
  bio?: string
  location?: string
  website?: string
  verify: UserVerifyStatus
  role: UserRole
  store_id?: string
  default_address_id?: string
  is_seller_verified?: boolean
  seller_rating?: number
  created_at: string
  updated_at: string
}

export interface UserProfile {
  _id: string
  name: string
  username: string
  avatar?: string
  cover_photo?: string
  bio?: string
  location?: string
  website?: string
  role: UserRole
  is_seller_verified?: boolean
  seller_rating?: number
  store?: {
    _id: string
    name: string
    rating: number
  }
  stats?: {
    product_count: number
    follower_count: number
    review_count: number
  }
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}
