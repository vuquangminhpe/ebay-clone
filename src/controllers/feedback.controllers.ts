// src/controllers/feedback.controllers.ts
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import feedbackService from '../services/feedback.services'
import { FeedbackTypes } from '../models/schemas/Feedback.schema'
import { UserRole } from '../models/schemas/User.schema'

// Define request body interfaces
interface CreateFeedbackReqBody {
  seller_id: string
  order_id: string
  rating: number
  type: FeedbackTypes
  comment: string
  is_public?: boolean
}

interface ReplyToFeedbackReqBody {
  reply: string
}

// Define request params interface
interface FeedbackParams extends ParamsDictionary {
  feedback_id: string
}

interface SellerParams extends ParamsDictionary {
  seller_id: string
}

export const createFeedbackController = async (
  req: Request<ParamsDictionary, any, CreateFeedbackReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { seller_id, order_id, rating, type, comment, is_public } = req.body

  try {
    // Create feedback
    const result = await feedbackService.createFeedback({
      seller_id,
      buyer_id: user_id,
      order_id,
      rating,
      type,
      comment,
      is_public
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Feedback submitted successfully',
      result
    })
  } catch (error) {
    console.error('Create feedback error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to submit feedback'
    })
  }
}

export const replyToFeedbackController = async (
  req: Request<FeedbackParams, any, ReplyToFeedbackReqBody>,
  res: Response
) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { feedback_id } = req.params
  const { reply } = req.body

  try {
    // Get feedback
    const feedback = await feedbackService.getFeedbackById(feedback_id)

    if (!feedback) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Feedback not found'
      })
    }

    // Verify permissions - only the seller or admin can reply
    if (role !== UserRole.ADMIN && feedback.seller_id.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'You are not authorized to reply to this feedback'
      })
    }

    // Reply to feedback
    const result = await feedbackService.replyToFeedback(feedback_id, reply)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Reply added successfully',
      result
    })
  } catch (error) {
    console.error('Reply to feedback error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to add reply'
    })
  }
}

export const getSellerFeedbackController = async (req: Request<SellerParams>, res: Response) => {
  const { seller_id } = req.params
  const { type, page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Get seller feedback
    const result = await feedbackService.getSellerFeedback(seller_id, {
      type: type as FeedbackTypes,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Seller feedback retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get seller feedback error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get seller feedback'
    })
  }
}

export const getSellerFeedbackSummaryController = async (req: Request<SellerParams>, res: Response) => {
  const { seller_id } = req.params

  try {
    // Get seller feedback summary
    const result = await feedbackService.getSellerFeedbackSummary(seller_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Seller feedback summary retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get seller feedback summary error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get seller feedback summary'
    })
  }
}

export const getBuyerFeedbackController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Get buyer feedback
    const result = await feedbackService.getBuyerFeedback(user_id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Buyer feedback retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get buyer feedback error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get buyer feedback'
    })
  }
}
