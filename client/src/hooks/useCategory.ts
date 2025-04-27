import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CategoryApi } from '@/apis/CategoryApi'
import { toast } from 'sonner'
import { CreateCategoryRequest, UpdateCategoryRequest } from '@/types/Category.type'

export const useCategories = (include_inactive: boolean = false) => {
  return useQuery({
    queryKey: ['categories', { include_inactive }],
    queryFn: () => CategoryApi.getCategories(include_inactive),
    select: (data) => data.data.result,
    staleTime: 10 * 60 * 1000 // 10 minutes as categories don't change often
  })
}

export const useCategoryTree = (include_inactive: boolean = false) => {
  return useQuery({
    queryKey: ['categories', 'tree', { include_inactive }],
    queryFn: () => CategoryApi.getCategoryTree(include_inactive),
    select: (data) => data.data.result,
    staleTime: 10 * 60 * 1000
  })
}

export const useRootCategories = (include_inactive: boolean = false) => {
  return useQuery({
    queryKey: ['categories', 'root', { include_inactive }],
    queryFn: () => CategoryApi.getRootCategories(include_inactive),
    select: (data) => data.data.result,
    staleTime: 10 * 60 * 1000
  })
}

export const useProductCountsByCategory = (include_inactive: boolean = false) => {
  return useQuery({
    queryKey: ['categories', 'product-counts', { include_inactive }],
    queryFn: () => CategoryApi.getProductCountsByCategory(include_inactive),
    select: (data) => data.data.result,
    staleTime: 5 * 60 * 1000 // 5 minutes as product counts may change
  })
}

export const useChildCategories = (parent_id: string, include_inactive: boolean = false) => {
  return useQuery({
    queryKey: ['categories', 'children', parent_id, { include_inactive }],
    queryFn: () => CategoryApi.getChildCategories(parent_id, include_inactive),
    select: (data) => data.data.result,
    staleTime: 10 * 60 * 1000,
    enabled: !!parent_id
  })
}

export const useCategoryBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['category', 'slug', slug],
    queryFn: () => CategoryApi.getCategoryBySlug(slug),
    select: (data) => data.data.result,
    staleTime: 10 * 60 * 1000,
    enabled: !!slug
  })
}

export const useCategoryById = (category_id: string) => {
  return useQuery({
    queryKey: ['category', category_id],
    queryFn: () => CategoryApi.getCategoryById(category_id),
    select: (data) => data.data.result,
    staleTime: 10 * 60 * 1000,
    enabled: !!category_id
  })
}

export const useCategoryProducts = (
  category_id: string,
  params?: {
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
  }
) => {
  return useQuery({
    queryKey: ['category', category_id, 'products', params],
    queryFn: () => CategoryApi.getCategoryProducts(category_id, params),
    select: (data) => data.data.result,
    staleTime: 5 * 60 * 1000, // 5 minutes as products may change
    enabled: !!category_id
  })
}

// Admin only mutations
export const useCreateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => CategoryApi.createCategory(data),
    onSuccess: () => {
      toast.success('Category created successfully')
      // Invalidate all category-related queries
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: () => {
      toast.error('Failed to create category')
    }
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ category_id, params }: { category_id: string; params: UpdateCategoryRequest }) =>
      CategoryApi.updateCategory(category_id, params),
    onSuccess: (_, variables) => {
      toast.success('Category updated successfully')
      // Invalidate all category-related queries and the specific category
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category', variables.category_id] })
    },
    onError: () => {
      toast.error('Failed to update category')
    }
  })
}
