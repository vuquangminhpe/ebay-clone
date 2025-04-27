import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface AddToCartReqBody {
  product_id: string
  quantity: number
  variant_id?: string
}

export interface UpdateCartItemReqBody {
  quantity: number
  selected?: boolean
}

export interface CartItemParams extends ParamsDictionary {
  product_id: string
}

export interface ApplyCouponReqBody {
  coupon_code: string
}
