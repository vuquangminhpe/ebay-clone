import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FeedbackApi, {
  CreateFeedbackRequest,
  ReplyToFeedbackRequest,
  SellerFeedbackParams,
  BuyerFeedbackParams
} from '@/apis/FeedbackApi'
import { toast } from 'sonner'

export const useCreateFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateFeedbackRequest) => FeedbackApi.createFeedback(request),
    onSuccess: (_, variables) => {
      toast.success('Feedback submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['seller-feedback', variables.seller_id] })
      queryClient.invalidateQueries({ queryKey: ['buyer-feedback'] })
    },
    onError: () => {
      toast.error('Failed to submit feedback')
    }
  })
}

export const useReplyToFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ feedback_id, request }: { feedback_id: string; request: ReplyToFeedbackRequest }) =>
      FeedbackApi.replyToFeedback(feedback_id, request),
    onSuccess: () => {
      toast.success('Reply submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['seller-feedback'] }) // We don't know the seller_id, so invalidate broadly
      queryClient.invalidateQueries({ queryKey: ['buyer-feedback'] })
    },
    onError: () => {
      toast.error('Failed to submit reply')
    }
  })
}

export const useSellerFeedback = (seller_id: string, params?: SellerFeedbackParams) => {
  return useQuery({
    queryKey: ['seller-feedback', seller_id, params],
    queryFn: () => FeedbackApi.getSellerFeedback(seller_id, params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!seller_id
  })
}

export const useSellerFeedbackSummary = (seller_id: string) => {
  return useQuery({
    queryKey: ['seller-feedback-summary', seller_id],
    queryFn: () => FeedbackApi.getSellerFeedbackSummary(seller_id),
    select: (data) => data.data,
    staleTime: 10 * 60 * 1000, // 10 minutes as summaries don't change frequently
    enabled: !!seller_id
  })
}

export const useBuyerFeedback = (params?: BuyerFeedbackParams) => {
  return useQuery({
    queryKey: ['buyer-feedback', params],
    queryFn: () => FeedbackApi.getBuyerFeedback(params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000
  })
}
