import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'
import { ProductCondition } from '@/types/products.type'
import { Product } from '@/types/products.type'

// Query parameters
export interface AdvancedSearchParams {
  q?: string // search query
  category?: string // category id
  min_price?: number // minimum price
  max_price?: number // maximum price
  condition?: ProductCondition // product condition
  free_shipping?: boolean // true/false
  has_reviews?: boolean // true/false
  min_rating?: number // minimum rating (1-5)
  seller?: string // seller id
  in_stock?: boolean // true/false
  tags?: string // comma-separated tags
  lat?: number // latitude for location search
  lng?: number // longitude for location search
  radius?: number // radius in km for location search
  sort?: string // sort field (created_at, price, rating, popularity)
  order?: 'asc' | 'desc' // sort order
  page?: number // page number
  limit?: number // items per page
}

// Response types
export interface SearchResultResponse {
  products: Product[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  filters: {
    query?: string
    category_id?: string
    min_price?: number
    max_price?: number
    condition?: ProductCondition
    free_shipping?: boolean
    has_reviews?: boolean
    min_rating?: number
    seller_id?: string
    in_stock?: boolean
    tags?: string[]
  }
  sort: {
    field: string
    order: 'asc' | 'desc'
  }
}

export interface SearchSuggestion {
  type: 'product' | 'category' | 'tag'
  id?: string
  text: string
  slug?: string
  count?: number
}

export interface SearchSuggestionsResponse {
  products: SearchSuggestion[]
  categories: SearchSuggestion[]
  tags: SearchSuggestion[]
}

export interface PopularSearch {
  text: string
  count: number
}

// API Client
export const SearchApi = {
  /**
   * Advanced search for products with multiple filters
   * @role Public (authentication optional)
   */
  advancedSearch: (params: AdvancedSearchParams) =>
    http.get<SuccessResponse<SearchResultResponse>>('search/products', { params }),

  /**
   * Get search suggestions as user types
   * @role Public
   */
  getSearchSuggestions: (q: string, limit?: number) =>
    http.get<SuccessResponse<SearchSuggestionsResponse>>('search/suggestions', {
      params: { q, limit }
    }),

  /**
   * Get popular search terms
   * @role Public
   */
  getPopularSearches: (limit?: number) =>
    http.get<SuccessResponse<PopularSearch[]>>('search/popular', {
      params: { limit }
    })
}

export default SearchApi
