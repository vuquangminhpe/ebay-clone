// src/services/feedback.services.ts
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Feedback, { FeedbackTypes } from '../models/schemas/Feedback.schema'
import orderService from './orders.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { OrderStatus } from '../constants/enums'

class FeedbackService {
  async createFeedback({
    seller_id,
    buyer_id,
    order_id,
    rating,
    type,
    comment,
    is_public = true
  }: {
    seller_id: string
    buyer_id: string
    order_id: string
    rating: number
    type: FeedbackTypes
    comment: string
    is_public?: boolean
  }) {
    // Check if order exists and belongs to buyer
    const order = await orderService.getOrderById(order_id)

    if (!order) {
      throw new ErrorWithStatus({
        message: 'Order not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (order.buyer_id.toString() !== buyer_id) {
      throw new ErrorWithStatus({
        message: 'You are not authorized to leave feedback for this order',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Check if order status allows feedback
    if (order.status !== (OrderStatus.DELIVERED as any)) {
      throw new ErrorWithStatus({
        message: 'You can only leave feedback for delivered orders',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if feedback already exists for this order and seller
    const existingFeedback = await databaseService.feedbacks.findOne({
      order_id: new ObjectId(order_id),
      seller_id: new ObjectId(seller_id),
      buyer_id: new ObjectId(buyer_id)
    })

    if (existingFeedback) {
      throw new ErrorWithStatus({
        message: 'You have already left feedback for this order',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Create feedback
    const feedback = new Feedback({
      seller_id: new ObjectId(seller_id),
      buyer_id: new ObjectId(buyer_id),
      order_id: new ObjectId(order_id),
      rating,
      type,
      comment,
      is_public
    })

    const result = await databaseService.feedbacks.insertOne(feedback)

    // Update seller's feedback rating
    await this.updateSellerRating(seller_id)

    return { ...feedback, _id: result.insertedId }
  }

  async getFeedbackById(feedback_id: string) {
    return databaseService.feedbacks.findOne({ _id: new ObjectId(feedback_id) })
  }

  async replyToFeedback(feedback_id: string, reply: string) {
    await databaseService.feedbacks.updateOne(
      { _id: new ObjectId(feedback_id) },
      {
        $set: {
          reply,
          replied_at: new Date(),
          updated_at: new Date()
        }
      }
    )

    return this.getFeedbackById(feedback_id)
  }

  async updateSellerRating(seller_id: string) {
    // Calculate average rating
    const pipeline = [
      {
        $match: {
          seller_id: new ObjectId(seller_id)
        }
      },
      {
        $group: {
          _id: null,
          avg_rating: { $avg: '$rating' },
          positive_count: {
            $sum: {
              $cond: [{ $eq: ['$type', FeedbackTypes.POSITIVE] }, 1, 0]
            }
          },
          neutral_count: {
            $sum: {
              $cond: [{ $eq: ['$type', FeedbackTypes.NEUTRAL] }, 1, 0]
            }
          },
          negative_count: {
            $sum: {
              $cond: [{ $eq: ['$type', FeedbackTypes.NEGATIVE] }, 1, 0]
            }
          },
          total_count: { $sum: 1 }
        }
      }
    ]

    const result = await databaseService.feedbacks.aggregate(pipeline).toArray()

    if (result.length > 0) {
      const { avg_rating, positive_count, neutral_count, negative_count, total_count } = result[0]

      // Update store rating
      const store = await databaseService.stores.findOne({ seller_id: new ObjectId(seller_id) })

      if (store) {
        await databaseService.stores.updateOne(
          { _id: store._id },
          {
            $set: {
              rating: parseFloat(avg_rating.toFixed(1)),
              feedback_counts: {
                positive: positive_count,
                neutral: neutral_count,
                negative: negative_count,
                total: total_count
              },
              positive_feedback_percent: parseFloat(((positive_count / total_count) * 100).toFixed(1)),
              updated_at: new Date()
            }
          }
        )
      }

      // Update user seller_rating
      await databaseService.users.updateOne(
        { _id: new ObjectId(seller_id) },
        {
          $set: {
            seller_rating: parseFloat(avg_rating.toFixed(1))
          }
        }
      )
    }
  }

  async getSellerFeedback(
    seller_id: string,
    {
      type,
      limit = 10,
      page = 1,
      sort = 'created_at',
      order = 'desc'
    }: {
      type?: FeedbackTypes
      limit?: number
      page?: number
      sort?: string
      order?: 'asc' | 'desc'
    } = {}
  ) {
    const skip = (page - 1) * limit

    // Build filter
    const filter: any = {
      seller_id: new ObjectId(seller_id),
      is_public: true
    }

    if (type) {
      filter.type = type
    }

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.feedbacks.countDocuments(filter)

    // Get feedback
    const feedback = await databaseService.feedbacks.find(filter).sort(sortOption).skip(skip).limit(limit).toArray()

    // Get buyer details for each feedback
    const enrichedFeedback = await Promise.all(
      feedback.map(async (fb) => {
        const buyer = await databaseService.users.findOne(
          { _id: fb.buyer_id },
          { projection: { name: 1, username: 1, avatar: 1 } }
        )

        return {
          ...fb,
          buyer: buyer
            ? {
                _id: buyer._id,
                name: buyer.name,
                username: buyer.username,
                avatar: buyer.avatar
              }
            : null
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    // Get feedback summary
    const summary = await this.getSellerFeedbackSummary(seller_id)

    return {
      feedback: enrichedFeedback,
      pagination: {
        total,
        page,
        limit,
        totalPages
      },
      summary
    }
  }

  async getSellerFeedbackSummary(seller_id: string) {
    const pipeline = [
      {
        $match: {
          seller_id: new ObjectId(seller_id)
        }
      },
      {
        $group: {
          _id: null,
          avg_rating: { $avg: '$rating' },
          positive_count: {
            $sum: {
              $cond: [{ $eq: ['$type', FeedbackTypes.POSITIVE] }, 1, 0]
            }
          },
          neutral_count: {
            $sum: {
              $cond: [{ $eq: ['$type', FeedbackTypes.NEUTRAL] }, 1, 0]
            }
          },
          negative_count: {
            $sum: {
              $cond: [{ $eq: ['$type', FeedbackTypes.NEGATIVE] }, 1, 0]
            }
          },
          total_count: { $sum: 1 }
        }
      }
    ]

    const result = await databaseService.feedbacks.aggregate(pipeline).toArray()

    if (result.length > 0) {
      const { avg_rating, positive_count, neutral_count, negative_count, total_count } = result[0]

      return {
        average_rating: parseFloat(avg_rating.toFixed(1)),
        counts: {
          positive: positive_count,
          neutral: neutral_count,
          negative: negative_count,
          total: total_count
        },
        positive_percentage: parseFloat(((positive_count / total_count) * 100).toFixed(1))
      }
    }

    return {
      average_rating: 0,
      counts: {
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0
      },
      positive_percentage: 0
    }
  }

  async getBuyerFeedback(
    buyer_id: string,
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

    // Build filter
    const filter = {
      buyer_id: new ObjectId(buyer_id)
    }

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.feedbacks.countDocuments(filter)

    // Get feedback
    const feedback = await databaseService.feedbacks.find(filter).sort(sortOption).skip(skip).limit(limit).toArray()

    // Get seller details for each feedback
    const enrichedFeedback = await Promise.all(
      feedback.map(async (fb) => {
        const seller = await databaseService.users.findOne(
          { _id: fb.seller_id },
          { projection: { name: 1, username: 1, avatar: 1 } }
        )

        const order = await orderService.getOrderById(fb.order_id.toString())

        return {
          ...fb,
          seller: seller
            ? {
                _id: seller._id,
                name: seller.name,
                username: seller.username,
                avatar: seller.avatar
              }
            : null,
          order: order
            ? {
                order_number: order.order_number,
                created_at: order.created_at
              }
            : null
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      feedback: enrichedFeedback,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }
}

const feedbackService = new FeedbackService()
export default feedbackService
