import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Inventory from '../models/schemas/Inventory.schema'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

class InventoryService {
  async createInventory({
    product_id,
    quantity,
    sku,
    location
  }: {
    product_id: string
    quantity: number
    sku?: string
    location?: string
  }) {
    // Check if inventory already exists for product
    const existingInventory = await databaseService.inventories.findOne({
      product_id: new ObjectId(product_id)
    })

    if (existingInventory) {
      throw new ErrorWithStatus({
        message: 'Inventory already exists for this product',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Create inventory
    const inventory = new Inventory({
      product_id: new ObjectId(product_id),
      quantity,
      sku,
      location,
      reserved_quantity: 0,
      last_restock_date: new Date()
    })

    const result = await databaseService.inventories.insertOne(inventory)

    return { ...inventory, _id: result.insertedId }
  }

  async updateInventory(
    product_id: string,
    {
      quantity,
      sku,
      location,
      reserved_quantity
    }: {
      quantity?: number
      sku?: string
      location?: string
      reserved_quantity?: number
    }
  ) {
    const updateData: any = {}

    // Only include fields that are provided in the payload
    if (quantity !== undefined) {
      updateData.quantity = quantity
      updateData.last_restock_date = new Date()
    }

    if (sku !== undefined) updateData.sku = sku
    if (location !== undefined) updateData.location = location
    if (reserved_quantity !== undefined) updateData.reserved_quantity = reserved_quantity

    // Add updated_at timestamp
    updateData.updated_at = new Date()

    await databaseService.inventories.findOneAndUpdate({ product_id: new ObjectId(product_id) }, { $set: updateData })

    return this.getInventoryByProductId(product_id)
  }

  async getInventoryByProductId(product_id: string) {
    return databaseService.inventories.findOne({ product_id: new ObjectId(product_id) })
  }

  async reserveInventory(product_id: string, quantity: number) {
    const inventory = await this.getInventoryByProductId(product_id)

    if (!inventory) {
      throw new ErrorWithStatus({
        message: 'Inventory not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (inventory.quantity - inventory.reserved_quantity < quantity) {
      throw new ErrorWithStatus({
        message: 'Not enough inventory available',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Increase reserved quantity
    await databaseService.inventories.updateOne(
      { product_id: new ObjectId(product_id) },
      {
        $inc: { reserved_quantity: quantity },
        $set: { updated_at: new Date() }
      }
    )

    return this.getInventoryByProductId(product_id)
  }

  async releaseReservedInventory(product_id: string, quantity: number) {
    const inventory = await this.getInventoryByProductId(product_id)

    if (!inventory) {
      throw new ErrorWithStatus({
        message: 'Inventory not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Decrease reserved quantity (ensure it doesn't go below 0)
    const newReservedQuantity = Math.max(0, inventory.reserved_quantity - quantity)

    await databaseService.inventories.updateOne(
      { product_id: new ObjectId(product_id) },
      {
        $set: {
          reserved_quantity: newReservedQuantity,
          updated_at: new Date()
        }
      }
    )

    return this.getInventoryByProductId(product_id)
  }

  async decreaseInventory(product_id: string, quantity: number) {
    const inventory = await this.getInventoryByProductId(product_id)

    if (!inventory) {
      throw new ErrorWithStatus({
        message: 'Inventory not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (inventory.quantity < quantity) {
      throw new ErrorWithStatus({
        message: 'Not enough inventory',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Decrease both total quantity and reserved quantity
    await databaseService.inventories.updateOne(
      { product_id: new ObjectId(product_id) },
      {
        $inc: {
          quantity: -quantity,
          reserved_quantity: -Math.min(quantity, inventory.reserved_quantity)
        },
        $set: { updated_at: new Date() }
      }
    )

    return this.getInventoryByProductId(product_id)
  }

  async getLowStockProducts(threshold: number = 5) {
    return databaseService.inventories
      .find({ quantity: { $lte: threshold } })
      .sort({ quantity: 1 })
      .toArray()
  }

  async getSellerInventory(
    seller_id: string,
    {
      limit = 20,
      page = 1,
      sort = 'updated_at',
      order = 'desc'
    }: {
      limit?: number
      page?: number
      sort?: string
      order?: 'asc' | 'desc'
    } = {}
  ) {
    const skip = (page - 1) * limit

    // First, get all product IDs for this seller
    const sellerProducts = await databaseService.products
      .find({ seller_id: new ObjectId(seller_id) })
      .project({ _id: 1 })
      .toArray()

    const productIds = sellerProducts.map((product) => product._id)

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.inventories.countDocuments({
      product_id: { $in: productIds }
    })

    // Get inventories
    const inventories = await databaseService.inventories
      .find({ product_id: { $in: productIds } })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get product details for each inventory
    const inventoriesWithProducts = await Promise.all(
      inventories.map(async (inventory) => {
        const product = await databaseService.products.findOne(
          { _id: inventory.product_id },
          {
            projection: {
              name: 1,
              price: 1,
              medias: 1
            }
          }
        )

        return {
          ...inventory,
          product: product
            ? {
                _id: product._id,
                name: product.name,
                price: product.price,
                image: product.medias?.find((m: any) => m.is_primary)?.url || product.medias?.[0]?.url || ''
              }
            : null,
          available_quantity: inventory.quantity - inventory.reserved_quantity
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      inventories: inventoriesWithProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }
}

const inventoryService = new InventoryService()
export default inventoryService
