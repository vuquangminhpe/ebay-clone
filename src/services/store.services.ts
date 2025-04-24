import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Store, { StoreStatus } from '../models/schemas/Store.schema'
import userService from './users.services'
import { UserRole } from '../models/schemas/User.schema'

class StoreService {
  async createStore({
    seller_id,
    name,
    description,
    logo,
    banner,
    policy
  }: {
    seller_id: string
    name: string
    description: string
    logo?: string
    banner?: string
    policy?: string
  }) {
    // Check if seller already has a store
    const existingStore = await this.getStoreByUserId(seller_id)
    if (existingStore) {
      throw new Error('Seller already has a store')
    }

    // Create new store
    const store = new Store({
      seller_id: new ObjectId(seller_id),
      name,
      description,
      logo,
      banner,
      policy,
      status: StoreStatus.ACTIVE,
      rating: 0,
      total_sales: 0,
      total_products: 0
    })

    const result = await databaseService.stores.insertOne(store)

    // Update user role to seller and add store reference
    await userService.updateUser(seller_id, {
      role: UserRole.SELLER,
      store_id: new ObjectId(result.insertedId),
      is_seller_verified: true
    })

    return { ...store, _id: result.insertedId }
  }

  async updateStore(
    store_id: string,
    {
      name,
      description,
      logo,
      banner,
      policy,
      status
    }: {
      name?: string
      description?: string
      logo?: string
      banner?: string
      policy?: string
      status?: StoreStatus
    }
  ) {
    const updateData: any = {}

    // Only include fields that are provided in the payload
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (logo !== undefined) updateData.logo = logo
    if (banner !== undefined) updateData.banner = banner
    if (policy !== undefined) updateData.policy = policy
    if (status !== undefined) updateData.status = status

    // Add updated_at timestamp
    updateData.updated_at = new Date()

    await databaseService.stores.findOneAndUpdate({ _id: new ObjectId(store_id) }, { $set: updateData })

    return this.getStoreById(store_id)
  }

  async getStoreById(store_id: string) {
    return databaseService.stores.findOne({ _id: new ObjectId(store_id) })
  }

  async getStoreByUserId(user_id: string) {
    return databaseService.stores.findOne({ seller_id: new ObjectId(user_id) })
  }

  async incrementProductCount(store_id: string) {
    await databaseService.stores.updateOne(
      { _id: new ObjectId(store_id) },
      {
        $inc: { total_products: 1 },
        $set: { updated_at: new Date() }
      }
    )
  }

  async decrementProductCount(store_id: string) {
    await databaseService.stores.updateOne(
      { _id: new ObjectId(store_id) },
      {
        $inc: { total_products: -1 },
        $set: { updated_at: new Date() }
      }
    )
  }

  async incrementSales(store_id: string, amount: number = 1) {
    await databaseService.stores.updateOne(
      { _id: new ObjectId(store_id) },
      {
        $inc: { total_sales: amount },
        $set: { updated_at: new Date() }
      }
    )
  }

  async updateStoreRating(store_id: string) {
    // Calculate average rating from all product reviews
    const pipeline = [
      {
        $match: {
          seller_id: new ObjectId(store_id)
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
      const { avg_rating } = result[0]

      await databaseService.stores.updateOne(
        { _id: new ObjectId(store_id) },
        {
          $set: {
            rating: parseFloat(avg_rating.toFixed(1)),
            updated_at: new Date()
          }
        }
      )
    }
  }

  async getStores({
    filter = {},
    limit = 20,
    page = 1,
    sort = 'rating',
    order = 'desc'
  }: {
    filter?: any
    limit?: number
    page?: number
    sort?: string
    order?: 'asc' | 'desc'
  } = {}) {
    const skip = (page - 1) * limit

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.stores.countDocuments(filter)

    // Get stores
    const stores = await databaseService.stores.find(filter).sort(sortOption).skip(skip).limit(limit).toArray()

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      stores,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async searchStores(
    query: string,
    options: {
      limit?: number
      page?: number
    } = {}
  ) {
    const { limit = 20, page = 1 } = options

    const filter: any = {
      status: StoreStatus.ACTIVE,
      $or: [{ name: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }]
    }

    return this.getStores({
      filter,
      limit,
      page,
      sort: 'rating',
      order: 'desc'
    })
  }

  async getTopStores(limit = 10) {
    return databaseService.stores
      .find({ status: StoreStatus.ACTIVE })
      .sort({ rating: -1, total_sales: -1 })
      .limit(limit)
      .toArray()
  }
}

const storeService = new StoreService()
export default storeService
