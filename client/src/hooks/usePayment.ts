import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PaymentApi, {
  AddPaymentMethodRequest,
  CreatePaypalOrderRequest,
  CapturePaypalPaymentRequest,
  TransactionQueryParams
} from '@/apis/PaymentApi'
import { toast } from 'sonner'

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: AddPaymentMethodRequest) => PaymentApi.addPaymentMethod(request),
    onSuccess: () => {
      toast.success('Payment method added successfully')
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
    onError: () => {
      toast.error('Failed to add payment method')
    }
  })
}

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => PaymentApi.getUserPaymentMethods(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payment_method_id: string) => PaymentApi.setDefaultPaymentMethod(payment_method_id),
    onSuccess: () => {
      toast.success('Default payment method set successfully')
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
    onError: () => {
      toast.error('Failed to set default payment method')
    }
  })
}

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payment_method_id: string) => PaymentApi.deletePaymentMethod(payment_method_id),
    onSuccess: () => {
      toast.success('Payment method deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
    onError: () => {
      toast.error('Failed to delete payment method')
    }
  })
}

export const useCreatePaypalOrder = () => {
  return useMutation({
    mutationFn: (request: CreatePaypalOrderRequest) => PaymentApi.createPaypalOrder(request),
    onSuccess: (data) => {
      return data.data // Return the PayPal order for client-side processing
    },
    onError: () => {
      toast.error('Failed to create PayPal order')
    }
  })
}

export const useCapturePaypalPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CapturePaypalPaymentRequest) => PaymentApi.capturePaypalPayment(request),
    onSuccess: () => {
      toast.success('Payment captured successfully')
      queryClient.invalidateQueries({ queryKey: ['buyer-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['seller-transactions'] })
      // This might also change order status, so invalidate orders
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] })
    },
    onError: () => {
      toast.error('Failed to capture payment')
    }
  })
}

export const useBuyerTransactions = (params?: TransactionQueryParams) => {
  return useQuery({
    queryKey: ['buyer-transactions', params],
    queryFn: () => PaymentApi.getUserTransactions(params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000
  })
}

export const useSellerTransactions = (params?: TransactionQueryParams) => {
  return useQuery({
    queryKey: ['seller-transactions', params],
    queryFn: () => PaymentApi.getSellerTransactions(params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000
  })
}
