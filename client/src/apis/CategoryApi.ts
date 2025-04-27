/* eslint-disable @typescript-eslint/no-explicit-any */
import { CategoryTree, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/Category.type'
import { Category, CategoryWithProducts } from '@/types/type'
import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

/**
 * API client for category management
 * Accessible by: All users (some endpoints have role restrictions)
 */
export const CategoryApi = {
  // Public endpoints (no authentication required)

  /**
   * Get all categories
   * @access Public
   */
  getCategories: (include_inactive: boolean = false) =>
    http.get<SuccessResponse<{ message: string; result: { categories: Category[]; pagination: any } }>>('/categories', {
      params: { include_inactive }
    }),

  /**
   * Get category tree (hierarchical structure)
   * @access Public
   */
  getCategoryTree: (include_inactive: boolean = false) =>
    http.get<SuccessResponse<{ message: string; result: CategoryTree[] }>>('/categories/tree', {
      params: { include_inactive }
    }),

  /**
   * Get root categories (top-level categories)
   * @access Public
   */
  getRootCategories: (include_inactive: boolean = false) =>
    http.get<SuccessResponse<{ message: string; result: Category[] }>>('/categories/root', {
      params: { include_inactive }
    }),

  /**
   * Get product counts by category
   * @access Public
   */
  getProductCountsByCategory: (include_inactive: boolean = false) =>
    http.get<
      SuccessResponse<{
        message: string
        result: { _id: string; name: string; slug: string; product_count: number; parent_id?: string }[]
      }>
    >('/categories/product-counts', { params: { include_inactive } }),

  /**
   * Get child categories for a parent category
   * @access Public
   */
  getChildCategories: (parent_id: string, include_inactive: boolean = false) =>
    http.get<SuccessResponse<{ message: string; result: Category[] }>>(`/categories/children/${parent_id}`, {
      params: { include_inactive }
    }),

  /**
   * Get category by slug
   * @access Public
   */
  getCategoryBySlug: (slug: string) =>
    http.get<
      SuccessResponse<{
        message: string
        result: { category: Category; children: Category[]; breadcrumbs: { _id: string; name: string; slug: string }[] }
      }>
    >(`/categories/slug/${slug}`),

  /**
   * Get category by ID
   * @access Public
   */
  getCategoryById: (category_id: string) =>
    http.get<
      SuccessResponse<{
        message: string
        result: { category: Category; children: Category[]; breadcrumbs: { _id: string; name: string; slug: string }[] }
      }>
    >(`/categories/${category_id}`),

  /**
   * Get products for a category
   * @access Public
   */
  getCategoryProducts: (
    category_id: string,
    params?: {
      page?: number
      limit?: number
      sort?: string
      order?: 'asc' | 'desc'
    }
  ) =>
    http.get<SuccessResponse<{ message: string; result: CategoryWithProducts }>>(
      `/categories/${category_id}/products`,
      { params }
    ),

  // Protected endpoints (authentication required - Admin only)

  /**
   * Create a new category
   * @access Private - Admin only
   */
  createCategory: (params: CreateCategoryRequest) =>
    http.post<SuccessResponse<{ message: string; result: Category }>>('/categories', params),

  /**
   * Update a category
   * @access Private - Admin only
   */
  updateCategory: (category_id: string, params: UpdateCategoryRequest) =>
    http.put<SuccessResponse<{ message: string; result: Category }>>(`/categories/${category_id}`, params)
}
