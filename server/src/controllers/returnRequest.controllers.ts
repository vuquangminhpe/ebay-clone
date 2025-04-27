// src/controllers/returnRequest.controllers.ts
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import returnRequestService from '../services/returnRequest.services'
import { ReturnReason, ReturnStatus } from '../models/schemas/ReturnRequest.schema'
import { UserRole } from '../models/schemas/User.schema'
import databaseService from '~/services/database.services'

// Define request body interfaces
interface CreateReturnReqBody {
  order_id: string
  product_id: string
  reason: ReturnReason
  details: string
  images?: string[]
}

interface UpdateReturnStatusReqBody {
  status: ReturnStatus
  seller_response?: string
  refund_amount?: number
}

// Define request params interface
interface ReturnRequestParams extends ParamsDictionary {
  return_id: string
}

export const createReturnRequestController = async (
  req: Request<ParamsDictionary, any, CreateReturnReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { order_id, product_id, reason, details, images } = req.body

  try {
    // Create return request
    const result = await returnRequestService.createReturnRequest({
      order_id,
      user_id,
      product_id,
      reason,
      details,
      images
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Return request created successfully',
      result
    })
  } catch (error) {
    console.error('Create return request error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to create return request'
    })
  }
}

export const updateReturnRequestStatusController = async (
  req: Request<ReturnRequestParams, any, UpdateReturnStatusReqBody>,
  res: Response
) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { return_id } = req.params
  const { status, seller_response, refund_amount } = req.body

  try {
    // Get return request
    const returnRequest = await returnRequestService.getReturnRequestById(return_id)

    if (!returnRequest) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Return request not found'
      })
    }

    // Verify permissions
    if (role !== UserRole.ADMIN) {
      // Get the order to check if this seller is involved
      const order = await databaseService.orders.findOne({ _id: returnRequest.order_id })

      if (!order) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Order not found'
        })
      }

      // Check if user is the seller of the returned product
      const orderItem = order.items.find(
        (item: any) => item.product_id.toString() === returnRequest.product_id.toString()
      )

      if (!orderItem || orderItem.seller_id.toString() !== user_id) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: 'You are not authorized to update this return request'
        })
      }
    }

    // Update return request status
    const result = await returnRequestService.updateReturnRequestStatus(return_id, {
      status,
      seller_response,
      refund_amount
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Return request status updated successfully',
      result
    })
  } catch (error) {
    console.error('Update return request status error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to update return request status'
    })
  }
}

export const getReturnRequestController = async (req: Request<ReturnRequestParams>, res: Response) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { return_id } = req.params

  try {
    // Get return request
    const returnRequest = await returnRequestService.getReturnRequestById(return_id)

    if (!returnRequest) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Return request not found'
      })
    }

    // Verify permissions - buyer, seller, or admin
    if (role !== UserRole.ADMIN && returnRequest.user_id.toString() !== user_id) {
      // Check if user is the seller of the returned product
      const order = await databaseService.orders.findOne({ _id: returnRequest.order_id })

      if (!order) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Order not found'
        })
      }

      const orderItem = order.items.find(
        (item: any) => item.product_id.toString() === returnRequest.product_id.toString()
      )

      if (!orderItem || orderItem.seller_id.toString() !== user_id) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: 'You are not authorized to view this return request'
        })
      }
    }

    // Get related information
    const [order, product, user] = await Promise.all([
      databaseService.orders.findOne({ _id: returnRequest.order_id }),
      databaseService.products.findOne({ _id: returnRequest.product_id }),
      databaseService.users.findOne({ _id: returnRequest.user_id })
    ])

    return res.status(HTTP_STATUS.OK).json({
      message: 'Return request retrieved successfully',
      result: {
        ...returnRequest,
        order: order
          ? {
              order_number: order.order_number,
              status: order.status,
              created_at: order.created_at
            }
          : null,
        product: product
          ? {
              name: product.name,
              image: product.medias?.find((m: any) => m.is_primary)?.url || product.medias?.[0]?.url || ''
            }
          : null,
        user: user
          ? {
              name: user.name,
              username: user.username,
              avatar: user.avatar
            }
          : null
      }
    })
  } catch (error) {
    console.error('Get return request error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get return request'
    })
  }
}

export const getBuyerReturnRequestsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { status, page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Get buyer return requests
    const result = await returnRequestService.getBuyerReturnRequests(user_id, {
      status: status as ReturnStatus,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Buyer return requests retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get buyer return requests error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get buyer return requests'
    })
  }
}

export const getSellerReturnRequestsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { status, page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Get seller return requests
    const result = await returnRequestService.getSellerReturnRequests(user_id, {
      status: status as ReturnStatus,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Seller return requests retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get seller return requests error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get seller return requests'
    })
  }
}
