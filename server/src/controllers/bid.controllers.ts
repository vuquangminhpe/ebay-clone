// src/controllers/bid.controllers.ts
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import bidService from '../services/bid.services'
import productService from '../services/products.services'

// Define request body interface
interface CreateBidReqBody {
  amount: number
}

// Define request params interface
interface BidParams extends ParamsDictionary {
  product_id: string
}

export const createBidController = async (req: Request<BidParams, any, CreateBidReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { product_id } = req.params
  const { amount } = req.body

  try {
    // Create bid
    const result = await bidService.createBid({
      product_id,
      bidder_id: user_id,
      amount
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Bid placed successfully',
      result
    })
  } catch (error) {
    console.error('Create bid error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to place bid'
    })
  }
}

export const getProductBidsController = async (req: Request<BidParams>, res: Response) => {
  const { product_id } = req.params
  const { page = '1', limit = '10', sort = 'amount', order = 'desc' } = req.query

  try {
    // Check if product exists
    const product = await productService.getProductById(product_id)
    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Product not found'
      })
    }

    // Get bids for product
    const result = await bidService.getBidsForProduct(product_id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Product bids retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get product bids error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get product bids'
    })
  }
}

export const getUserBidsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Get user bids
    const result = await bidService.getUserBids(user_id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'User bids retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get user bids error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get user bids'
    })
  }
}

export const getWonAuctionsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { page = '1', limit = '10', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Get won auctions
    const result = await bidService.getWonAuctions(user_id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Won auctions retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get won auctions error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get won auctions'
    })
  }
}
