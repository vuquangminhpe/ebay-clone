export interface CartItem {
  product_id: string
  quantity: number
  price: number
  variant_id?: string
  selected: boolean
  product_name?: string
  product_image?: string
  available?: boolean
  in_stock?: boolean
  current_price?: number
}

export interface Cart {
  _id: string
  user_id: string
  items: CartItem[]
  coupon_code?: string
  subtotal?: number
  created_at: string
  updated_at: string
}

export interface AddToCartRequest {
  product_id: string
  quantity: number
  variant_id?: string
}

export interface UpdateCartItemRequest {
  quantity?: number
  selected?: boolean
}

export interface CartTotal {
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  items_count: number
  total_items: number
}
