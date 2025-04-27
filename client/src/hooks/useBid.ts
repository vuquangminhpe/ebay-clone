import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BidApi, CreateBidRequest } from '@/apis/BindApi'
import { toast } from 'sonner'

export const usePlaceBid = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, params }: { productId: string; params: CreateBidRequest }) =>
      BidApi.placeBid(productId, params),
    onSuccess: (_, variables) => {
      toast.success('Bid placed successfully')
      queryClient.invalidateQueries({ queryKey: ['product-bids', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['user-bids'] })
    },
    onError: () => {
      toast.error('Failed to place bid')
    }
  })
}

export const useProductBids = (
  productId: string,
  params?: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }
) => {
  return useQuery({
    queryKey: ['product-bids', productId, params],
    queryFn: () => BidApi.getProductBids(productId, params),
    select: (data) => data.data,
    staleTime: 1 * 60 * 1000, // 1 minute, shorter for bids as they change frequently
    enabled: !!productId
  })
}

export const useUserBids = (params?: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }) => {
  return useQuery({
    queryKey: ['user-bids', params],
    queryFn: () => BidApi.getUserBids(params),
    select: (data) => data.data,
    staleTime: 1 * 60 * 1000 // 1 minute
  })
}

export const useWonAuctions = (params?: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }) => {
  return useQuery({
    queryKey: ['won-auctions', params],
    queryFn: () => BidApi.getWonAuctions(params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}
