import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CartApi } from '@/apis/CartApi'
import { toast } from 'sonner'
import { AddToCartRequest, UpdateCartItemRequest } from '@/types/Cart.type'

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => CartApi.getCart(),
    select: (data) => data.data.result,
    staleTime: 1 * 60 * 1000 // 1 minute because cart can change frequently
  })
}

export const useAddToCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AddToCartRequest) => CartApi.addToCart(data),
    onSuccess: () => {
      toast.success('Item added to cart')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: () => {
      toast.error('Failed to add item to cart')
    }
  })
}

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ product_id, params }: { product_id: string; params: UpdateCartItemRequest }) =>
      CartApi.updateCartItem(product_id, params),
    onSuccess: () => {
      toast.success('Cart updated')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: () => {
      toast.error('Failed to update cart')
    }
  })
}

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (product_id: string) => CartApi.removeFromCart(product_id),
    onSuccess: () => {
      toast.success('Item removed from cart')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: () => {
      toast.error('Failed to remove item from cart')
    }
  })
}

export const useClearCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => CartApi.clearCart(),
    onSuccess: () => {
      toast.success('Cart cleared')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: () => {
      toast.error('Failed to clear cart')
    }
  })
}

export const useApplyCoupon = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (coupon_code: string) => CartApi.applyCoupon(coupon_code),
    onSuccess: () => {
      toast.success('Coupon applied')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-total'] })
    },
    onError: () => {
      toast.error('Failed to apply coupon')
    }
  })
}

export const useRemoveCoupon = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => CartApi.removeCoupon(),
    onSuccess: () => {
      toast.success('Coupon removed')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-total'] })
    },
    onError: () => {
      toast.error('Failed to remove coupon')
    }
  })
}

export const useCartTotal = () => {
  return useQuery({
    queryKey: ['cart-total'],
    queryFn: () => CartApi.calculateCartTotal(),
    select: (data) => data.data.result,
    staleTime: 1 * 60 * 1000 // 1 minute
  })
}
