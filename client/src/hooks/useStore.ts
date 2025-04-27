import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  StoreApi,
  CreateStoreRequest,
  UpdateStoreRequest,
  StoreProductsParams,
  StoresListParams
} from '@/apis/StoreApi'
import { toast } from 'sonner'

export const useCreateStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateStoreRequest) => StoreApi.createStore(request),
    onSuccess: () => {
      toast.success('Store created successfully')
      queryClient.invalidateQueries({ queryKey: ['store', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['me'] }) // User profile may change after store creation
    },
    onError: () => {
      toast.error('Failed to create store')
    }
  })
}

export const useUpdateStore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateStoreRequest) => StoreApi.updateStore(request),
    onSuccess: () => {
      toast.success('Store updated successfully')
      queryClient.invalidateQueries({ queryKey: ['store', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
    onError: () => {
      toast.error('Failed to update store')
    }
  })
}

export const useStore = (store_id: string) => {
  return useQuery({
    queryKey: ['store', store_id],
    queryFn: () => StoreApi.getStore(store_id),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!store_id
  })
}

export const useStoreBySeller = (seller_id: string) => {
  return useQuery({
    queryKey: ['store', 'seller', seller_id],
    queryFn: () => StoreApi.getStoreBySeller(seller_id),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!seller_id
  })
}

export const useMyStore = () => {
  return useQuery({
    queryKey: ['store', 'me'],
    queryFn: () => StoreApi.getMyStore(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000
  })
}

export const useStores = (params?: StoresListParams) => {
  return useQuery({
    queryKey: ['stores', params],
    queryFn: () => StoreApi.getStores(params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000
  })
}

export const useStoreProducts = (store_id: string, params?: StoreProductsParams) => {
  return useQuery({
    queryKey: ['store', store_id, 'products', params],
    queryFn: () => StoreApi.getStoreProducts(store_id, params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!store_id
  })
}

export const useUpgradeToSeller = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => StoreApi.upgradeToSeller(),
    onSuccess: () => {
      toast.success('Account upgraded to seller successfully')
      queryClient.invalidateQueries({ queryKey: ['me'] }) // Refresh user profile to reflect new role
    },
    onError: () => {
      toast.error('Failed to upgrade account to seller')
    }
  })
}

export const useTopStores = () => {
  return useQuery({
    queryKey: ['stores', 'top'],
    queryFn: () => StoreApi.getTopStores(),
    select: (data) => data.data,
    staleTime: 10 * 60 * 1000 // 10 minutes as top stores don't change frequently
  })
}
