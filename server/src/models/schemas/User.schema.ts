import { ObjectId } from 'mongodb'
import { AccountStatus } from '../../constants/enums'

export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin'
}

export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

interface UserType {
  _id?: ObjectId
  name?: string
  email: string
  date_of_birth?: Date
  password: string
  created_at?: Date
  updated_at?: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  typeAccount?: AccountStatus
  count_type_account: number
  subscription_end_date?: Date
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
  is_online?: boolean
  last_active?: Date
  role?: UserRole
  phone?: string
  is_seller_verified?: boolean
  store_id?: ObjectId
  default_address_id?: ObjectId
  seller_rating?: number
  total_sales?: number
  total_purchases?: number
  paypal_email?: string
}

export default class User {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  created_at: Date
  updated_at: Date
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus
  typeAccount: AccountStatus
  count_type_account: number
  subscription_end_date?: Date
  bio: string
  location: string
  website: string
  username: string
  avatar: string
  cover_photo: string
  is_online: boolean
  last_active: Date
  role: UserRole
  phone: string
  is_seller_verified: boolean
  store_id?: ObjectId
  default_address_id?: ObjectId
  seller_rating: number
  total_sales: number
  total_purchases: number
  paypal_email?: string

  constructor(user: UserType) {
    const date = new Date()
    this._id = user._id
    this.name = user.name || ''
    this.email = user.email
    this.date_of_birth = user.date_of_birth || new Date()
    this.password = user.password
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.typeAccount = user.typeAccount || AccountStatus.FREE
    this.count_type_account = user.count_type_account || 0
    this.subscription_end_date = user.subscription_end_date || date
    this.bio = user.bio || ''
    this.location = user.location || ''
    this.website = user.website || ''
    this.username = user.username || ''
    this.avatar = user.avatar || ''
    this.cover_photo = user.cover_photo || ''
    this.is_online = user.is_online || false
    this.last_active = user.last_active || date
    this.role = user.role || UserRole.BUYER
    this.phone = user.phone || ''
    this.is_seller_verified = user.is_seller_verified || false
    this.store_id = user.store_id
    this.default_address_id = user.default_address_id
    this.seller_rating = user.seller_rating || 0
    this.total_sales = user.total_sales || 0
    this.total_purchases = user.total_purchases || 0
    this.paypal_email = user.paypal_email
  }
}
