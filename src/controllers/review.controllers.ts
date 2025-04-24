import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { REVIEW_MESSAGE } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import reviewService from '../services/review.services'
import { CreateReviewReqBody, ReviewParams, UpdateReviewReqBody } from '../models/request/Reviews.request.ts'

export const createReviewController = async (
  req: Request<ParamsDictionary, any, CreateReviewReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { product_id, order_id, rating, comment, images } = req.body

  try {
    // Check if user can review this product
    const canReview = await reviewService.checkCanReview({
      user_id,
      product_id,
      order_id
    })

    if (!canReview.can_review) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: canReview.reason,
        existing_review: canReview.existing_review
      })
    }

    // Create review
    const result = await reviewService.createReview({
      product_id,
      order_id,
      user_id,
      rating,
      comment,
      images
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: REVIEW_MESSAGE.CREATE_REVIEW_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Create review error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to create review'
    })
  }
}

export const updateReviewController = async (req: Request<ReviewParams, any, UpdateReviewReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { review_id } = req.params
  const { rating, comment, images } = req.body

  try {
    // Check if review exists and belongs to user
    const review = await reviewService.getReviewById(review_id)

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: REVIEW_MESSAGE.REVIEW_NOT_FOUND
      })
    }

    if (review.user_id.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: REVIEW_MESSAGE.UNAUTHORIZED_REVIEW_ACCESS
      })
    }

    // Update review
    const result = await reviewService.updateReview(review_id, {
      rating,
      comment,
      images
    })

    return res.status(HTTP_STATUS.OK).json({
      message: REVIEW_MESSAGE.UPDATE_REVIEW_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Update review error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to update review'
    })
  }
}

export const deleteReviewController = async (req: Request<ReviewParams>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { review_id } = req.params

  try {
    // Check if review exists and belongs to user
    const review = await reviewService.getReviewById(review_id)

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: REVIEW_MESSAGE.REVIEW_NOT_FOUND
      })
    }

    if (review.user_id.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: REVIEW_MESSAGE.UNAUTHORIZED_REVIEW_ACCESS
      })
    }

    // Delete review
    await reviewService.deleteReview(review_id)

    return res.status(HTTP_STATUS.OK).json({
      message: REVIEW_MESSAGE.DELETE_REVIEW_SUCCESS
    })
  } catch (error) {
    console.error('Delete review error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to delete review'
    })
  }
}

export const getReviewController = async (req: Request<ReviewParams>, res: Response) => {
  const { review_id } = req.params

  try {
    // Get review
    const review = await reviewService.getReviewById(review_id)

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: REVIEW_MESSAGE.REVIEW_NOT_FOUND
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: REVIEW_MESSAGE.GET_REVIEW_SUCCESS,
      result: review
    })
  } catch (error) {
    console.error('Get review error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get review'
    })
  }
}

export const getProductReviewsController = async (req: Request, res: Response) => {
  const { product_id } = req.params
  const { page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Get product reviews
    const result = await reviewService.getProductReviews(product_id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: REVIEW_MESSAGE.GET_REVIEWS_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Get product reviews error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get product reviews'
    })
  }
}

export const getSellerReviewsController = async (req: Request, res: Response) => {
  const { seller_id } = req.params
  const { page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Get seller reviews
    const result = await reviewService.getSellerReviews(seller_id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: REVIEW_MESSAGE.GET_REVIEWS_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Get seller reviews error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get seller reviews'
    })
  }
}

export const getMyReviewsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Get user reviews
    const result = await reviewService.getUserReviews(user_id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: REVIEW_MESSAGE.GET_REVIEWS_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Get user reviews error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get user reviews'
    })
  }
}

export const checkCanReviewController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { product_id, order_id } = req.query

  try {
    if (!product_id || !order_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Product ID and Order ID are required'
      })
    }

    // Check if user can review
    const result = await reviewService.checkCanReview({
      user_id,
      product_id: product_id as string,
      order_id: order_id as string
    })

    return res.status(HTTP_STATUS.OK).json({
      result
    })
  } catch (error) {
    console.error('Check can review error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to check review eligibility'
    })
  }
}
