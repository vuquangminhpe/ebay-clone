import { Request, Response } from 'express'
import HTTP_STATUS from '../constants/httpStatus'
import searchService from '../services/search.services'
import { ProductCondition } from '../constants/enums'
import { TokenPayload } from '../models/request/User.request'

export const advancedSearchController = async (req: Request, res: Response) => {
  try {
    const {
      q, // search query
      category, // category id
      min_price, // minimum price
      max_price, // maximum price
      condition, // product condition
      free_shipping, // true/false
      has_reviews, // true/false
      min_rating, // minimum rating (1-5)
      seller, // seller id
      in_stock, // true/false
      tags, // comma-separated tags
      lat,
      lng,
      radius, // location search (if applicable)
      sort = 'created_at', // sort field
      order = 'desc', // sort order
      page = '1', // page number
      limit = '20' // items per page
    } = req.query

    // Parse and validate query parameters
    const searchOptions: any = {
      query: q as string,
      category_id: category as string,
      sort: sort as string,
      order: order as 'asc' | 'desc',
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    }

    // Add numeric filters if provided
    if (min_price !== undefined) {
      searchOptions.min_price = parseFloat(min_price as string)
    }

    if (max_price !== undefined) {
      searchOptions.max_price = parseFloat(max_price as string)
    }

    if (min_rating !== undefined) {
      searchOptions.min_rating = parseFloat(min_rating as string)
    }

    // Add boolean filters if provided
    if (free_shipping !== undefined) {
      searchOptions.free_shipping = free_shipping === 'true'
    }

    if (has_reviews !== undefined) {
      searchOptions.has_reviews = has_reviews === 'true'
    }

    if (in_stock !== undefined) {
      searchOptions.in_stock = in_stock === 'true'
    }

    // Add condition if valid
    if (condition && Object.values(ProductCondition).includes(condition as ProductCondition)) {
      searchOptions.condition = condition as ProductCondition
    }

    // Add seller ID if provided
    if (seller) {
      searchOptions.seller_id = seller as string
    }

    // Process tags if provided
    if (tags) {
      searchOptions.tags = (tags as string).split(',').map((tag) => tag.trim())
    }

    // Process location if all parameters are provided
    if (lat && lng && radius) {
      searchOptions.location = {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
        radius: parseFloat(radius as string)
      }
    }

    // Execute search
    const result = await searchService.advancedSearch(searchOptions)

    // Log the search query for analytics
    const userId = req.decode_authorization ? (req.decode_authorization as TokenPayload).user_id : null
    searchService.recordSearchQuery(
      userId,
      (q as string) || '',
      {
        category,
        min_price,
        max_price,
        condition,
        free_shipping,
        has_reviews,
        min_rating,
        seller,
        in_stock,
        tags
      },
      result.pagination.total
    )

    return res.status(HTTP_STATUS.OK).json({
      message: 'Search results retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Advanced search error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Error processing search request',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const getSearchSuggestionsController = async (req: Request, res: Response) => {
  try {
    const { q, limit = '10' } = req.query

    if (!q) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Search query is required'
      })
    }

    const result = await searchService.getSearchSuggestions(q as string, parseInt(limit as string))

    return res.status(HTTP_STATUS.OK).json({
      message: 'Search suggestions retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Search suggestions error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Error getting search suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const getPopularSearchesController = async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query

    const result = await searchService.getPopularSearches(parseInt(limit as string))

    return res.status(HTTP_STATUS.OK).json({
      message: 'Popular searches retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Popular searches error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Error getting popular searches',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
