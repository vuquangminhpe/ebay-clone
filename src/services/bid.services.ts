import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Bid from '../models/schemas/Bid.schema'
import productService from './products.services'
import { ProductStatus } from '../models/schemas/Product.schema'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

class BidService {
  async createBid({ product_id, bidder_id, amount }: { product_id: string; bidder_id: string; amount: number }) {
    // Check if product exists and is an auction item
    const product = await productService.getProductById(product_id)

    if (!product) {
      throw new ErrorWithStatus({
        message: 'Product not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new ErrorWithStatus({
        message: 'Product is not active',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (!product.isAuction) {
      throw new ErrorWithStatus({
        message: 'Product is not an auction item',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (product.auctionEndTime && new Date(product.auctionEndTime) < new Date()) {
      throw new ErrorWithStatus({
        message: 'Auction has ended',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get current highest bid
    const highestBid = await this.getHighestBid(product_id)

    // Check if bid amount is higher than current highest bid
    if (highestBid && amount <= highestBid.amount) {
      throw new ErrorWithStatus({
        message: `Bid amount must be higher than current highest bid: ${highestBid.amount}`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if bid amount is higher than starting price
    if (!highestBid && amount < product.price) {
      throw new ErrorWithStatus({
        message: `Bid amount must be at least the starting price: ${product.price}`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Create bid
    const bid = new Bid({
      product_id: new ObjectId(product_id),
      bidder_id: new ObjectId(bidder_id),
      amount
    })

    const result = await databaseService.bids.insertOne(bid)

    return { ...bid, _id: result.insertedId }
  }

  async getHighestBid(product_id: string) {
    return databaseService.bids.findOne({ product_id: new ObjectId(product_id) }, { sort: { amount: -1 } })
  }

  async getBidsForProduct(
    product_id: string,
    {
      limit = 10,
      page = 1,
      sort = 'amount',
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
    const total = await databaseService.bids.countDocuments({
      product_id: new ObjectId(product_id)
    })

    // Get bids
    const bids = await databaseService.bids
      .find({ product_id: new ObjectId(product_id) })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get bidder details for each bid
    const bidsWithUsers = await Promise.all(
      bids.map(async (bid) => {
        const user = await databaseService.users.findOne(
          { _id: bid.bidder_id },
          { projection: { name: 1, username: 1, avatar: 1 } }
        )

        return {
          ...bid,
          bidder: user
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
      bids: bidsWithUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async getUserBids(
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
    const total = await databaseService.bids.countDocuments({
      bidder_id: new ObjectId(user_id)
    })

    // Get bids
    const bids = await databaseService.bids
      .find({ bidder_id: new ObjectId(user_id) })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get product details for each bid
    const bidsWithProducts = await Promise.all(
      bids.map(async (bid) => {
        const product = await databaseService.products.findOne(
          { _id: bid.product_id },
          {
            projection: {
              name: 1,
              medias: 1,
              price: 1,
              auctionEndTime: 1
            }
          }
        )

        return {
          ...bid,
          product: product
            ? {
                _id: product._id,
                name: product.name,
                image: product.medias?.find((m: any) => m.is_primary)?.url || product.medias?.[0]?.url || '',
                price: product.price,
                auctionEndTime: product.auctionEndTime
              }
            : null,
          is_highest: await this.isHighestBidder(bid.product_id.toString(), user_id),
          is_auction_ended: product?.auctionEndTime ? new Date(product.auctionEndTime) < new Date() : false
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      bids: bidsWithProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async isHighestBidder(product_id: string, user_id: string): Promise<boolean> {
    const highestBid = await this.getHighestBid(product_id)
    return highestBid ? highestBid.bidder_id.toString() === user_id : false
  }

  async getWonAuctions(
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

    // Find all products where auction has ended
    const endedAuctions = await databaseService.products
      .find({
        isAuction: true,
        auctionEndTime: { $lt: new Date() }
      })
      .toArray()

    // Get auction products where user is highest bidder
    const wonAuctionIds = []

    for (const auction of endedAuctions) {
      const highestBid = await this.getHighestBid(auction._id.toString())
      if (highestBid && highestBid.bidder_id.toString() === user_id) {
        wonAuctionIds.push(auction._id)
      }
    }

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get products with pagination
    const products = await databaseService.products
      .find({ _id: { $in: wonAuctionIds } })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Add highest bid info to each product
    const productsWithBids = await Promise.all(
      products.map(async (product) => {
        const highestBid = await this.getHighestBid(product._id.toString())
        return {
          ...product,
          winning_bid: highestBid ? highestBid.amount : null
        }
      })
    )

    // Calculate total pages
    const total = wonAuctionIds.length
    const totalPages = Math.ceil(total / limit)

    return {
      won_auctions: productsWithBids,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }
}

const bidService = new BidService()
export default bidService
