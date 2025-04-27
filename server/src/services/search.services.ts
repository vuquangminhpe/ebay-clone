import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { ProductCondition, ProductStatus } from '../constants/enums'

interface AdvancedSearchOptions {
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
  location?: {
    latitude: number
    longitude: number
    radius: number // in km
  }
  sort?: string
  order?: 'asc' | 'desc'
  limit?: number
  page?: number
}

class SearchService {
  async advancedSearch(options: AdvancedSearchOptions) {
    const {
      query,
      category_id,
      min_price,
      max_price,
      condition,
      free_shipping,
      has_reviews,
      min_rating,
      seller_id,
      in_stock,
      tags,
      location,
      sort = 'created_at',
      order = 'desc',
      limit = 20,
      page = 1
    } = options

    const skip = (page - 1) * limit

    // Build MongoDB aggregation pipeline for advanced search
    const pipeline: any[] = []

    // Match stage for filtering
    const matchCriteria: any = {
      status: ProductStatus.ACTIVE
    }

    // Text search
    if (query && query.trim() !== '') {
      // Use text index for search
      matchCriteria.$text = { $search: query }
      // If using text search and sort is not specified, sort by text score
      if (sort === 'created_at' || sort === 'relevance') {
        pipeline.push({ $sort: { score: { $meta: 'textScore' }, _id: -1 } })
      }
    }

    // Category filter
    if (category_id) {
      // Get all subcategories
      const subcategories = await this.getAllSubcategories(category_id)

      // Add parent category to the list
      const category_ids = [new ObjectId(category_id), ...subcategories.map((c) => c._id)]

      matchCriteria.category_id = { $in: category_ids }
    }

    // Price range filter
    if (min_price !== undefined || max_price !== undefined) {
      matchCriteria.price = {}
      if (min_price !== undefined) {
        matchCriteria.price.$gte = min_price
      }
      if (max_price !== undefined) {
        matchCriteria.price.$lte = max_price
      }
    }

    // Condition filter
    if (condition) {
      matchCriteria.condition = condition
    }

    // Free shipping filter
    if (free_shipping !== undefined) {
      matchCriteria.free_shipping = free_shipping
    }

    // Has reviews filter
    if (has_reviews) {
      matchCriteria.total_reviews = { $gt: 0 }
    }

    // Minimum rating filter
    if (min_rating !== undefined) {
      matchCriteria.rating = { $gte: min_rating }
    }

    // Seller filter
    if (seller_id) {
      matchCriteria.seller_id = new ObjectId(seller_id)
    }

    // In stock filter
    if (in_stock) {
      matchCriteria.quantity = { $gt: 0 }
    }

    // Tags filter
    if (tags && tags.length > 0) {
      matchCriteria.tags = { $in: tags }
    }

    // Add match stage to pipeline
    pipeline.push({ $match: matchCriteria })

    // Location-based search (if enabled)
    if (location) {
      // This requires geospatial indexing
      // For this to work, we should have saved lat/long with each product
      // and created a geospatial index
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          distanceField: 'distance',
          maxDistance: location.radius * 1000, // convert km to meters
          spherical: true
        }
      })
    }

    // Add sort stage based on user preference
    const sortStage: any = {}

    // Handle different sort options
    switch (sort) {
      case 'price':
        sortStage.price = order === 'asc' ? 1 : -1
        break
      case 'rating':
        sortStage.rating = order === 'asc' ? 1 : -1
        break
      case 'popularity':
        sortStage.views = -1 // Always sort by most popular first
        break
      case 'relevance':
        // If we're doing a text search, this is handled above
        if (!query) {
          sortStage.created_at = -1 // Default to newest
        }
        break
      default: // Default to created_at
        sortStage.created_at = order === 'asc' ? 1 : -1
    }

    // Add _id as tie-breaker to ensure consistent results
    sortStage._id = order === 'asc' ? 1 : -1

    pipeline.push({ $sort: sortStage })

    // Count total results for pagination
    const countPipeline = [...pipeline] // Clone the pipeline
    countPipeline.push({ $count: 'total' })
    const countResult = await databaseService.products.aggregate(countPipeline).toArray()
    const total = countResult.length > 0 ? countResult[0].total : 0

    // Add pagination
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: limit })

    // Enhance products with seller information
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'seller_id',
        foreignField: '_id',
        as: 'seller'
      }
    })

    // Only get the fields we need from seller
    pipeline.push({
      $addFields: {
        seller: {
          $map: {
            input: '$seller',
            as: 'seller',
            in: {
              _id: '$$seller._id',
              name: '$$seller.name',
              username: '$$seller.username',
              avatar: '$$seller.avatar',
              is_seller_verified: '$$seller.is_seller_verified'
            }
          }
        }
      }
    })

    // Unwind the seller array to get a single object
    pipeline.push({
      $addFields: {
        seller: { $arrayElemAt: ['$seller', 0] }
      }
    })

    // Execute the pipeline
    const products = await databaseService.products.aggregate(pipeline).toArray()

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages
      },
      filters: {
        query,
        category_id,
        min_price,
        max_price,
        condition,
        free_shipping,
        has_reviews,
        min_rating,
        seller_id,
        in_stock,
        tags
      },
      sort: {
        field: sort,
        order
      }
    }
  }

  // Helper method to get all subcategories recursively
  private async getAllSubcategories(category_id: string): Promise<{ _id: ObjectId }[]> {
    const directChildren = await databaseService.categories
      .find({ parent_id: new ObjectId(category_id) })
      .project({ _id: 1 })
      .toArray()

    let allSubcategories = [...directChildren]

    // Recursively get children of each direct child
    for (const child of directChildren) {
      const childSubcategories = await this.getAllSubcategories(child._id.toString())
      allSubcategories = [...allSubcategories, ...childSubcategories]
    }

    return allSubcategories as any
  }

  async getSearchSuggestions(query: string, limit = 10) {
    if (!query || query.trim() === '') {
      return []
    }

    // Get product suggestions
    const productSuggestions = await databaseService.products
      .find(
        {
          $text: { $search: query },
          status: ProductStatus.ACTIVE
        },
        { projection: { name: 1, score: { $meta: 'textScore' } } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .toArray()

    // Get category suggestions
    const categorySuggestions = await databaseService.categories
      .find(
        {
          $or: [{ name: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }],
          is_active: true
        },
        { projection: { name: 1, slug: 1 } }
      )
      .limit(limit / 2)
      .toArray()

    // Get tag suggestions
    const tagSuggestions = await databaseService.products
      .aggregate([
        {
          $match: {
            tags: { $regex: query, $options: 'i' },
            status: ProductStatus.ACTIVE
          }
        },
        { $unwind: '$tags' },
        { $match: { tags: { $regex: query, $options: 'i' } } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit / 2 }
      ])
      .toArray()

    return {
      products: productSuggestions.map((p) => ({
        type: 'product',
        id: p._id.toString(),
        text: p.name
      })),
      categories: categorySuggestions.map((c) => ({
        type: 'category',
        id: c._id.toString(),
        text: c.name,
        slug: c.slug
      })),
      tags: tagSuggestions.map((t) => ({
        type: 'tag',
        text: t._id,
        count: t.count
      }))
    }
  }

  async getPopularSearches(limit = 10) {
    // In a real application, we would track user searches in a collection
    // and return the most popular ones. For this example, we'll return
    // dummy popular searches.
    return [
      { text: 'smartphone', count: 245 },
      { text: 'laptop', count: 198 },
      { text: 'headphones', count: 156 },
      { text: 'gaming', count: 134 },
      { text: 'smartwatch', count: 122 },
      { text: 'camera', count: 108 },
      { text: 'bluetooth speaker', count: 87 },
      { text: 'tablet', count: 76 },
      { text: 'power bank', count: 65 },
      { text: 'wireless charger', count: 54 }
    ].slice(0, limit)
  }

  async recordSearchQuery(userId: string | null, query: string, filters: any = {}, results_count: number) {
    // In a real app, we would record search queries to improve search quality
    // and track popular searches
    await databaseService.db.collection('search_logs').insertOne({
      user_id: userId ? new ObjectId(userId) : null,
      query,
      filters,
      results_count,
      timestamp: new Date()
    })
  }
}

const searchService = new SearchService()
export default searchService
