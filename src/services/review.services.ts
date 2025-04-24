import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Review from '../models/schemas/Review.schema'
import productService from './products.services'
import storeService from './store.services'
import orderService from './orders.services'

class ReviewService {
  async createReview({
    product_id,
    order_id,
    user_id,
    rating,
    comment,
    images
  }: {
    product_id: string
    order_id: string
    user_id: string
    rating: number
    comment: string
    images?: string[]
  }) {
    // Get product to get seller_id
    const product = await productService.getProductById(product_id)
    if (!product) {
      throw new Error('Product not found')
    }

    // Check if user already reviewed this product from this order
    const existingReview = await databaseService.reviews.findOne({
      product_id: new ObjectId(product_id),
      order_id: new ObjectId(order_id),
      user_id: new ObjectId(user_id)
    })

    if (existingReview) {
      throw new Error('You have already reviewed this product for this order')
    }

    // Create review
    const review = new Review({
      product_id: new ObjectId(product_id),
      order_id: new ObjectId(order_id),
      user_id: new ObjectId(user_id),
      seller_id: product.seller_id,
      rating,
      comment,
      images
    })

    const result = await databaseService.reviews.insertOne(review)

    // Update product ratings
    await this.updateProductRating(product_id)

    // Update store ratings
    const store = await storeService.getStoreByUserId(product.seller_id.toString())
    if (store) {
      await storeService.updateStoreRating(store._id.toString())
    }

    return { ...review, _id: result.insertedId }
  }

  async updateReview(
    review_id: string,
    {
      rating,
      comment,
      images
    }: {
      rating?: number
      comment?: string
      images?: string[]
    }
  ) {
    const updateData: any = {}

    // Only include fields that are provided in the payload
    if (rating !== undefined) updateData.rating = rating
    if (comment !== undefined) updateData.comment = comment
    if (images !== undefined) updateData.images = images

    // Add updated_at timestamp
    updateData.updated_at = new Date()

    await databaseService.reviews.findOneAndUpdate({ _id: new ObjectId(review_id) }, { $set: updateData })

    const updatedReview = await this.getReviewById(review_id)

    // Update product ratings
    if (updatedReview) {
      await this.updateProductRating(updatedReview.product_id.toString())

      // Update store ratings
      const product = await productService.getProductById(updatedReview.product_id.toString())
      if (product) {
        const store = await storeService.getStoreByUserId(product.seller_id.toString())
        if (store) {
          await storeService.updateStoreRating(store._id.toString())
        }
      }
    }

    return updatedReview
  }

  async getReviewById(review_id: string) {
    return databaseService.reviews.findOne({ _id: new ObjectId(review_id) })
  }

  async deleteReview(review_id: string) {
    const review = await this.getReviewById(review_id)

    if (!review) {
      throw new Error('Review not found')
    }

    await databaseService.reviews.deleteOne({ _id: new ObjectId(review_id) })

    // Update product ratings
    await this.updateProductRating(review.product_id.toString())

    // Update store ratings
    const product = await productService.getProductById(review.product_id.toString())
    if (product) {
      const store = await storeService.getStoreByUserId(product.seller_id.toString())
      if (store) {
        await storeService.updateStoreRating(store._id.toString())
      }
    }

    return { success: true }
  }

  private async updateProductRating(product_id: string) {
    // Calculate average rating
    const pipeline = [
      {
        $match: {
          product_id: new ObjectId(product_id)
        }
      },
      {
        $group: {
          _id: null,
          avg_rating: { $avg: '$rating' },
          total_reviews: { $sum: 1 }
        }
      }
    ]

    const result = await databaseService.reviews.aggregate(pipeline).toArray()

    if (result.length > 0) {
      const { avg_rating, total_reviews } = result[0]

      // Update product
      await databaseService.products.updateOne(
        { _id: new ObjectId(product_id) },
        {
          $set: {
            rating: parseFloat(avg_rating.toFixed(1)),
            total_reviews
          }
        }
      )
    } else {
      // No reviews, reset rating
      await databaseService.products.updateOne(
        { _id: new ObjectId(product_id) },
        {
          $set: {
            rating: 0,
            total_reviews: 0
          }
        }
      )
    }
  }

  async getProductReviews(
    product_id: string,
    {
      limit = 10,
      page = 1,
      sort = 'created_at',
      order = 'desc'
    }: {
      limit?: number
      page?: number
      sort?: string
      order?: 'asc' | 'desc'
    } = {}
  ) {
    const skip = (page - 1) * limit

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.reviews.countDocuments({
      product_id: new ObjectId(product_id)
    })

    // Get reviews
    const reviews = await databaseService.reviews
      .find({ product_id: new ObjectId(product_id) })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get user details for each review
    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const user = await databaseService.users.findOne(
          { _id: review.user_id },
          { projection: { name: 1, username: 1, avatar: 1 } }
        )

        return {
          ...review,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                avatar: user.avatar
              }
            : null
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    // Get rating distribution
    const ratingDistribution = await this.getProductRatingDistribution(product_id)

    return {
      reviews: reviewsWithUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages
      },
      rating_distribution: ratingDistribution
    }
  }

  async getProductRatingDistribution(product_id: string) {
    const pipeline = [
      {
        $match: {
          product_id: new ObjectId(product_id)
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]

    const result = await databaseService.reviews.aggregate(pipeline).toArray()

    // Convert to rating distribution object
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }

    result.forEach((item) => {
      distribution[item._id] = item.count
    })

    return distribution
  }

  async getSellerReviews(
    seller_id: string,
    {
      limit = 10,
      page = 1,
      sort = 'created_at',
      order = 'desc'
    }: {
      limit?: number
      page?: number
      sort?: string
      order?: 'asc' | 'desc'
    } = {}
  ) {
    const skip = (page - 1) * limit

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.reviews.countDocuments({
      seller_id: new ObjectId(seller_id)
    })

    // Get reviews
    const reviews = await databaseService.reviews
      .find({ seller_id: new ObjectId(seller_id) })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get product and user details for each review
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const [product, user] = await Promise.all([
          databaseService.products.findOne({ _id: review.product_id }, { projection: { name: 1, medias: 1 } }),
          databaseService.users.findOne({ _id: review.user_id }, { projection: { name: 1, username: 1, avatar: 1 } })
        ])

        return {
          ...review,
          product: product
            ? {
                _id: product._id,
                name: product.name,
                image: product.medias?.find((m) => m.is_primary)?.url || product.medias?.[0]?.url || ''
              }
            : null,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                avatar: user.avatar
              }
            : null
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      reviews: enrichedReviews,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async getUserReviews(
    user_id: string,
    {
      limit = 10,
      page = 1,
      sort = 'created_at',
      order = 'desc'
    }: {
      limit?: number
      page?: number
      sort?: string
      order?: 'asc' | 'desc'
    } = {}
  ) {
    const skip = (page - 1) * limit

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.reviews.countDocuments({
      user_id: new ObjectId(user_id)
    })

    // Get reviews
    const reviews = await databaseService.reviews
      .find({ user_id: new ObjectId(user_id) })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get product details for each review
    const reviewsWithProducts = await Promise.all(
      reviews.map(async (review) => {
        const product = await databaseService.products.findOne(
          { _id: review.product_id },
          { projection: { name: 1, medias: 1 } }
        )

        return {
          ...review,
          product: product
            ? {
                _id: product._id,
                name: product.name,
                image: product.medias?.find((m) => m.is_primary)?.url || product.medias?.[0]?.url || ''
              }
            : null
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      reviews: reviewsWithProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async checkCanReview({ user_id, product_id, order_id }: { user_id: string; product_id: string; order_id: string }) {
    // Check if order exists and belongs to user
    const order = await orderService.getOrderById(order_id)

    if (!order) {
      return {
        can_review: false,
        reason: 'Order not found'
      }
    }

    if (order.buyer_id.toString() !== user_id) {
      return {
        can_review: false,
        reason: 'This order does not belong to you'
      }
    }

    // Check if order contains the product
    const hasProduct = order.items.some((item: any) => item.product_id.toString() === product_id)

    if (!hasProduct) {
      return {
        can_review: false,
        reason: 'This order does not contain the specified product'
      }
    }

    // Check if user already reviewed this product for this order
    const existingReview = await databaseService.reviews.findOne({
      product_id: new ObjectId(product_id),
      order_id: new ObjectId(order_id),
      user_id: new ObjectId(user_id)
    })

    if (existingReview) {
      return {
        can_review: false,
        reason: 'You have already reviewed this product for this order',
        existing_review: existingReview
      }
    }

    return {
      can_review: true
    }
  }
}

const reviewService = new ReviewService()
export default reviewService
