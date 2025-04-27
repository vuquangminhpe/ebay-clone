import { AddToCartRequest, Cart, CartTotal, UpdateCartItemRequest } from '@/types/Cart.type'
import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

/**
 * API client for cart management
 * Accessible by: Authenticated users only
 */
export const CartApi = {
  /**
   * Get user's cart
   * @access Private - Any authenticated user
   */
  getCart: () => http.get<SuccessResponse<{ message: string; result: Cart }>>('/cart'),

  /**
   * Add item to cart
   * @access Private - Any authenticated user
   */
  addToCart: (params: AddToCartRequest) =>
    http.post<SuccessResponse<{ message: string; result: Cart }>>('/cart', params),

  /**
   * Update cart item quantity or selected status
   * @access Private - Any authenticated user
   */
  updateCartItem: (product_id: string, params: UpdateCartItemRequest) =>
    http.put<SuccessResponse<{ message: string; result: Cart }>>(`/cart/${product_id}`, params),

  /**
   * Remove item from cart
   * @access Private - Any authenticated user
   */
  removeFromCart: (product_id: string) => http.delete<SuccessResponse<{ message: string }>>(`/cart/${product_id}`),

  /**
   * Clear cart
   * @access Private - Any authenticated user
   */
  clearCart: () => http.delete<SuccessResponse<{ message: string }>>('/cart'),

  /**
   * Apply coupon to cart
   * @access Private - Any authenticated user
   */
  applyCoupon: (coupon_code: string) =>
    http.post<
      SuccessResponse<{
        message: string
        result: {
          coupon_code: string
          discount_amount: number
          subtotal_before_discount: number
          subtotal_after_discount: number
        }
      }>
    >('/cart/coupon', { coupon_code }),

  /**
   * Remove coupon from cart
   * @access Private - Any authenticated user
   */
  removeCoupon: () => http.delete<SuccessResponse<{ message: string }>>('/cart/coupon'),

  /**
   * Calculate cart total
   * @access Private - Any authenticated user
   */
  calculateCartTotal: () => http.get<SuccessResponse<{ message: string; result: CartTotal }>>('/cart/calculate-total')
}
