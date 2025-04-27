import { Router } from 'express'
import {
  advancedSearchController,
  getPopularSearchesController,
  getSearchSuggestionsController
} from '../controllers/search.controllers'
import { wrapAsync } from '../utils/handler'
import { makeOptional } from '../utils/makeOptional'
import { AccessTokenValidator } from '../middlewares/users.middlewares'

const advancedSearchRouter = Router()

/**
 * @description Advanced search for products with multiple filters
 * @route GET /search/products
 * @query q - Search query
 * @query category - Category ID
 * @query min_price - Minimum price
 * @query max_price - Maximum price
 * @query condition - Product condition
 * @query free_shipping - True/False
 * @query has_reviews - True/False
 * @query min_rating - Minimum rating (1-5)
 * @query seller - Seller ID
 * @query in_stock - True/False
 * @query tags - Comma-separated tags
 * @query lat - Latitude for location search
 * @query lng - Longitude for location search
 * @query radius - Radius in km for location search
 * @query sort - Sort field (created_at, price, rating, popularity)
 * @query order - Sort order (asc, desc)
 * @query page - Page number
 * @query limit - Items per page
 * @access Public (authentication optional)
 */
advancedSearchRouter.get('/products', makeOptional(AccessTokenValidator), wrapAsync(advancedSearchController))

/**
 * @description Get search suggestions as user types
 * @route GET /search/suggestions
 * @query q - Partial search query
 * @query limit - Maximum number of suggestions
 * @access Public
 */
advancedSearchRouter.get('/suggestions', wrapAsync(getSearchSuggestionsController))

/**
 * @description Get popular search terms
 * @route GET /search/popular
 * @query limit - Maximum number of popular searches to return
 * @access Public
 */
advancedSearchRouter.get('/popular', wrapAsync(getPopularSearchesController))

export default advancedSearchRouter
