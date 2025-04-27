import { keepPreviousData, useQuery } from '@tanstack/react-query'
import SearchApi, { AdvancedSearchParams } from '@/apis/SearchApi'
import { ProductCondition } from '@/types/type'

export const useAdvancedSearch = (params: AdvancedSearchParams) => {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => SearchApi.advancedSearch(params),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params // Only run if there are params
  })
}

export const useSearchSuggestions = (q: string, limit?: number) => {
  return useQuery({
    queryKey: ['search-suggestions', q, limit],
    queryFn: () => SearchApi.getSearchSuggestions(q, limit),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!q && q.length > 1, // Only search if query is at least 2 characters
    placeholderData: keepPreviousData // Keep previous results while loading new ones for smoother UX
  })
}

export const usePopularSearches = (limit?: number) => {
  return useQuery({
    queryKey: ['popular-searches', limit],
    queryFn: () => SearchApi.getPopularSearches(limit),
    select: (data) => data.data,
    staleTime: 30 * 60 * 1000 // 30 minutes as popular searches don't change frequently
  })
}

// A convenient hook that combines location search with other filters
export const useNearbyProductsSearch = (params: {
  lat: number
  lng: number
  radius?: number
  category?: string
  min_price?: number
  max_price?: number
  condition?: ProductCondition
  free_shipping?: boolean
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}) => {
  const { lat, lng, ...otherParams } = params

  return useQuery({
    queryKey: ['search', 'nearby', params],
    queryFn: () => SearchApi.advancedSearch({ lat, lng, ...otherParams }),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!lat && !!lng // Only run if location is provided
  })
}
