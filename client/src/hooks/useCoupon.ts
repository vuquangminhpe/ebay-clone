import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CouponApi, CreateCouponRequest, UpdateCouponRequest, ValidateCouponRequest } from '@/apis/CouponApi'
import { toast } from 'sonner'
import { typeParams } from '@/types/typeParams'

// Admin queries and mutations
export const useCoupons = (params: typeParams & { is_active?: boolean }) => {
  return useQuery({
    queryKey: ['coupons', params],
    queryFn: () => CouponApi.getCoupons(params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export const useCoupon = (coupon_id: string) => {
  return useQuery({
    queryKey: ['coupon', coupon_id],
    queryFn: () => CouponApi.getCoupon(coupon_id),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!coupon_id
  })
}

export const useCreateCoupon = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCouponRequest) => CouponApi.createCoupon(data),
    onSuccess: () => {
      toast.success('Coupon created successfully')
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      queryClient.invalidateQueries({ queryKey: ['active-coupons'] })
    },
    onError: () => {
      toast.error('Failed to create coupon')
    }
  })
}

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ coupon_id, data }: { coupon_id: string; data: UpdateCouponRequest }) =>
      CouponApi.updateCoupon(coupon_id, data),
    onSuccess: (_, variables) => {
      toast.success('Coupon updated successfully')
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      queryClient.invalidateQueries({ queryKey: ['coupon', variables.coupon_id] })
      queryClient.invalidateQueries({ queryKey: ['active-coupons'] })
    },
    onError: () => {
      toast.error('Failed to update coupon')
    }
  })
}

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (coupon_id: string) => CouponApi.deleteCoupon(coupon_id),
    onSuccess: () => {
      toast.success('Coupon deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      queryClient.invalidateQueries({ queryKey: ['active-coupons'] })
    },
    onError: () => {
      toast.error('Failed to delete coupon')
    }
  })
}

// Public endpoints
export const useActiveCoupons = () => {
  return useQuery({
    queryKey: ['active-coupons'],
    queryFn: () => CouponApi.getActiveCoupons(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000
  })
}

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: (data: ValidateCouponRequest) => CouponApi.validateCoupon(data),
    onSuccess: (data) => {
      const result = data.data
      if (result.valid) {
        toast.success('Coupon is valid')
      } else {
        toast.warning('Coupon is not valid')
      }
    },
    onError: () => {
      toast.error('Failed to validate coupon')
    }
  })
}
