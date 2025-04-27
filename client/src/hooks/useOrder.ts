import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OrdersApi } from '@/apis/OrdersApi'
import { toast } from 'sonner'
import {
  CreateOrderRequest,
  CancelOrderRequest,
  PayOrderRequest,
  ShipOrderRequest,
  DeliverOrderRequest
} from '@/types/Order.type'

export const useCreateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateOrderRequest) => OrdersApi.createOrder(params),
    onSuccess: (data) => {
      toast.success('Order created successfully')
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] })
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] }) // Assuming cart is cleared after order creation
      return data.data.result // Return the order for redirect purposes
    },
    onError: () => {
      toast.error('Failed to create order')
    }
  })
}

export const useOrder = (order_id: string) => {
  return useQuery({
    queryKey: ['order', order_id],
    queryFn: () => OrdersApi.getOrder(order_id),
    select: (data) => data.data.result,
    staleTime: 1 * 60 * 1000, // 1 minute as order status can change
    enabled: !!order_id
  })
}

export const useBuyerOrders = (params?: {
  page?: number
  limit?: number
  status?: string
  date_from?: string
  date_to?: string
  sort?: string
  order?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: ['buyer-orders', params],
    queryFn: () => OrdersApi.getBuyerOrders(params),
    select: (data) => data.data.result,
    staleTime: 1 * 60 * 1000
  })
}

export const useSellerOrders = (params?: {
  page?: number
  limit?: number
  status?: string
  date_from?: string
  date_to?: string
  sort?: string
  order?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: ['seller-orders', params],
    queryFn: () => OrdersApi.getSellerOrders(params),
    select: (data) => data.data.result,
    staleTime: 1 * 60 * 1000
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ order_id, params }: { order_id: string; params: CancelOrderRequest }) =>
      OrdersApi.cancelOrder(order_id, params),
    onSuccess: (_, variables) => {
      toast.success('Order cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['order', variables.order_id] })
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] })
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
    },
    onError: () => {
      toast.error('Failed to cancel order')
    }
  })
}

export const usePayOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ order_id, params }: { order_id: string; params: PayOrderRequest }) =>
      OrdersApi.payOrder(order_id, params),
    onSuccess: (_, variables) => {
      toast.success('Payment processed successfully')
      queryClient.invalidateQueries({ queryKey: ['order', variables.order_id] })
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] })
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
    },
    onError: () => {
      toast.error('Payment failed')
    }
  })
}

export const useShipOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ order_id, params }: { order_id: string; params: ShipOrderRequest }) =>
      OrdersApi.shipOrder(order_id, params),
    onSuccess: (_, variables) => {
      toast.success('Order marked as shipped')
      queryClient.invalidateQueries({ queryKey: ['order', variables.order_id] })
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] })
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
    },
    onError: () => {
      toast.error('Failed to update shipping status')
    }
  })
}

export const useDeliverOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ order_id, params }: { order_id: string; params: DeliverOrderRequest }) =>
      OrdersApi.deliverOrder(order_id, params),
    onSuccess: (_, variables) => {
      toast.success('Order marked as delivered')
      queryClient.invalidateQueries({ queryKey: ['order', variables.order_id] })
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] })
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
    },
    onError: () => {
      toast.error('Failed to update delivery status')
    }
  })
}

// Admin only
export const useAllOrders = (params?: {
  page?: number
  limit?: number
  status?: string
  date_from?: string
  date_to?: string
  sort?: string
  order?: 'asc' | 'desc'
  seller_id?: string
}) => {
  return useQuery({
    queryKey: ['admin-orders', params],
    queryFn: () => OrdersApi.getAllOrders(params),
    select: (data) => data.data.result,
    staleTime: 1 * 60 * 1000
  })
}
