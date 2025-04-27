import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ProductsApi } from '@/apis/Products'
import { toast } from 'sonner'
import { CreateProductRequest, UpdateProductRequest, ProductCondition } from '@/types/type'

export const useProducts = (params?: {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  category_id?: string
  min_price?: number
  max_price?: number
  condition?: ProductCondition
  free_shipping?: boolean
  search?: string
  seller_id?: string
  status?: string
}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => ProductsApi.getProducts(params),
    select: (data) => data.data.result,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export const useProduct = (product_id: string) => {
  return useQuery({
    queryKey: ['product', product_id],
    queryFn: () => ProductsApi.getProduct(product_id),
    select: (data) => data.data.result,
    staleTime: 5 * 60 * 1000,
    enabled: !!product_id
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductRequest) => ProductsApi.createProduct(data),
    onSuccess: () => {
      toast.success('Product created successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
    },
    onError: () => {
      toast.error('Failed to create product')
    }
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ product_id, params }: { product_id: string; params: UpdateProductRequest }) =>
      ProductsApi.updateProduct(product_id, params),
    onSuccess: (_, variables) => {
      toast.success('Product updated successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.product_id] })
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
    },
    onError: () => {
      toast.error('Failed to update product')
    }
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (product_id: string) => ProductsApi.deleteProduct(product_id),
    onSuccess: () => {
      toast.success('Product deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
    },
    onError: () => {
      toast.error('Failed to delete product')
    }
  })
}

export const useSellerProducts = (params?: {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  status?: string
}) => {
  return useQuery({
    queryKey: ['seller-products', params],
    queryFn: () => ProductsApi.getSellerProducts(params),
    select: (data) => data.data.result,
    staleTime: 5 * 60 * 1000
  })
}

export const useRelatedProducts = (product_id: string, limit?: number) => {
  return useQuery({
    queryKey: ['related-products', product_id, limit],
    queryFn: () => ProductsApi.getRelatedProducts(product_id, limit),
    select: (data) => data.data.result,
    staleTime: 5 * 60 * 1000,
    enabled: !!product_id
  })
}
