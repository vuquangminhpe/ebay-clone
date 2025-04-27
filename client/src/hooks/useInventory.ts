import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { InventoryApi, CreateInventoryRequest, UpdateInventoryRequest } from '@/apis/InventoryApi'
import { toast } from 'sonner'
import { typeParams } from '@/types/typeParams'

export const useCreateInventory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInventoryRequest) => InventoryApi.createInventory(data),
    onSuccess: (_, variables) => {
      toast.success('Inventory created successfully')
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.product_id] })
      // Also invalidate the product as it may have stock status changes
      queryClient.invalidateQueries({ queryKey: ['product', variables.product_id] })
    },
    onError: () => {
      toast.error('Failed to create inventory')
    }
  })
}

export const useUpdateInventory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ product_id, data }: { product_id: string; data: UpdateInventoryRequest }) =>
      InventoryApi.updateInventory(product_id, data),
    onSuccess: (_, variables) => {
      toast.success('Inventory updated successfully')
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.product_id] })
      queryClient.invalidateQueries({ queryKey: ['low-stock'] })
      // Also invalidate the product as it may have stock status changes
      queryClient.invalidateQueries({ queryKey: ['product', variables.product_id] })
    },
    onError: () => {
      toast.error('Failed to update inventory')
    }
  })
}

export const useInventory = (product_id: string) => {
  return useQuery({
    queryKey: ['inventory', product_id],
    queryFn: () => InventoryApi.getInventory(product_id),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000, // 2 minutes as inventory can change with orders
    enabled: !!product_id
  })
}

export const useSellerInventory = (params: typeParams) => {
  return useQuery({
    queryKey: ['seller-inventory', params],
    queryFn: () => InventoryApi.getSellerInventory(params),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000
  })
}

export const useLowStockProducts = (threshold?: number) => {
  return useQuery({
    queryKey: ['low-stock', threshold],
    queryFn: () => InventoryApi.getLowStockProducts(threshold),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}
