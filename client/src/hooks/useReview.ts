import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReviewApi, {
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewQueryParams,
  CheckCanReviewParams
} from '@/apis/ReviewApi'
import { toast } from 'sonner'

export const useCreateReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateReviewRequest) => ReviewApi.createReview(request),
    onSuccess: (_, variables) => {
      toast.success('Review submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['product-reviews', variables.product_id] })
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] })
      // Also invalidate related product data as ratings may have changed
      queryClient.invalidateQueries({ queryKey: ['product', variables.product_id] })
    },
    onError: () => {
      toast.error('Failed to submit review')
    }
  })
}

export const useUpdateReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ review_id, request }: { review_id: string; request: UpdateReviewRequest }) =>
      ReviewApi.updateReview(review_id, request),
    onSuccess: () => {
      toast.success('Review updated successfully')
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] }) // We don't know the product_id
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['review'] })
    },
    onError: () => {
      toast.error('Failed to update review')
    }
  })
}

export const useDeleteReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (review_id: string) => ReviewApi.deleteReview(review_id),
    onSuccess: () => {
      toast.success('Review deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] })
    },
    onError: () => {
      toast.error('Failed to delete review')
    }
  })
}

export const useReview = (review_id: string) => {
  return useQuery({
    queryKey: ['review', review_id],
    queryFn: () => ReviewApi.getReview(review_id),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!review_id
  })
}

export const useProductReviews = (product_id: string, params?: ReviewQueryParams) => {
  return useQuery({
    queryKey: ['product-reviews', product_id, params],
    queryFn: () => ReviewApi.getProductReviews(product_id, params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!product_id
  })
}

export const useSellerReviews = (seller_id: string, params?: ReviewQueryParams) => {
  return useQuery({
    queryKey: ['seller-reviews', seller_id, params],
    queryFn: () => ReviewApi.getSellerReviews(seller_id, params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!seller_id
  })
}

export const useUserReviews = (params?: ReviewQueryParams) => {
  return useQuery({
    queryKey: ['user-reviews', params],
    queryFn: () => ReviewApi.getMyReviews(params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000
  })
}

export const useCheckCanReview = (params: CheckCanReviewParams) => {
  return useQuery({
    queryKey: ['can-review', params],
    queryFn: () => ReviewApi.checkCanReview(params),
    select: (data) => data.data,
    staleTime: 1 * 60 * 1000, // Short stale time as this may change after leaving a review
    enabled: !!params.product_id && !!params.order_id
  })
}
