import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Product, {
  ProductCondition,
  ProductMedia,
  ProductStatus,
  ProductVariant
} from '../models/schemas/Product.schema'
import storeService from './store.services'
import { CreateProductReqBody, UpdateProductReqBody } from '../models/request/Product.request'

class ProductService {
  async createProduct(user_id: string, payload: CreateProductReqBody) {
    // Get seller's store
    const store = await storeService.getStoreByUserId(user_id)

    // Create product
    const product = new Product({
      seller_id: new ObjectId(user_id),
      name: payload.name,
      description: payload.description,
      price: payload.price,
      quantity: payload.quantity,
      category_id: new ObjectId(payload.category_id),
      condition: payload.condition,
      status: ProductStatus.ACTIVE,
      medias: payload.medias,
      tags: payload.tags || [],
      variants: payload.variants,
      shipping_price: payload.shipping_price,
      free_shipping: payload.free_shipping,
      views: 0
    })

    const result = await databaseService.products.insertOne(product)

    // Update store product count
    if (store) {
      await storeService.incrementProductCount(store._id.toString())
    }

    return { ...product, _id: result.insertedId }
  }

  async updateProduct(product_id: string, payload: UpdateProductReqBody) {
    const updateData: any = {}

    // Only include fields that are provided in the payload
    if (payload.name !== undefined) updateData.name = payload.name
    if (payload.description !== undefined) updateData.description = payload.description
    if (payload.price !== undefined) updateData.price = payload.price
    if (payload.quantity !== undefined) updateData.quantity = payload.quantity
    if (payload.category_id !== undefined) updateData.category_id = new ObjectId(payload.category_id)
    if (payload.condition !== undefined) updateData.condition = payload.condition
    if (payload.medias !== undefined) updateData.medias = payload.medias
    if (payload.tags !== undefined) updateData.tags = payload.tags
    if (payload.variants !== undefined) updateData.variants = payload.variants
    if (payload.shipping_price !== undefined) updateData.shipping_price = payload.shipping_price
    if (payload.free_shipping !== undefined) updateData.free_shipping = payload.free_shipping
    if (payload.status !== undefined) updateData.status = payload.status

    // Add updated_at timestamp
    updateData.updated_at = new Date()

    await databaseService.products.findOneAndUpdate({ _id: new ObjectId(product_id) }, { $set: updateData })

    return this.getProductById(product_id)
  }

  async getProductById(product_id: string) {
    return databaseService.products.findOne({ _id: new ObjectId(product_id) })
  }

  async getProductsByIds(product_ids: ObjectId[]) {
    return databaseService.products
      .find({
        _id: { $in: product_ids }
      })
      .toArray()
  }

  async incrementProductViews(product_id: string) {
    await databaseService.products.updateOne({ _id: new ObjectId(product_id) }, { $inc: { views: 1 } })
  }

  async getProducts({
    filter,
    limit = 20,
    page = 1,
    sort = 'created_at',
    order = 'desc'
  }: {
    filter: any
    limit: number
    page: number
    sort?: string
    order?: 'asc' | 'desc'
  }) {
    const skip = (page - 1) * limit

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.products.countDocuments(filter)

    // Get products
    const products = await databaseService.products.find(filter).sort(sortOption).skip(skip).limit(limit).toArray()

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async searchProducts(
    query: string,
    options: {
      limit?: number
      page?: number
      category_id?: string
      min_price?: number
      max_price?: number
      condition?: ProductCondition
      free_shipping?: boolean
    } = {}
  ) {
    const { limit = 20, page = 1, category_id, min_price, max_price, condition, free_shipping } = options

    const filter: any = {
      status: ProductStatus.ACTIVE,
      $text: { $search: query }
    }

    // Add optional filters
    if (category_id) {
      filter.category_id = new ObjectId(category_id)
    }

    if (min_price !== undefined || max_price !== undefined) {
      filter.price = {}
      if (min_price !== undefined) {
        filter.price.$gte = min_price
      }
      if (max_price !== undefined) {
        filter.price.$lte = max_price
      }
    }

    if (condition) {
      filter.condition = condition
    }

    if (free_shipping !== undefined) {
      filter.free_shipping = free_shipping
    }

    return this.getProducts({
      filter,
      limit,
      page,
      sort: 'score',
      order: 'desc'
    })
  }

  async decreaseProductStock(product_id: string, quantity: number, variant_id?: string) {
    if (variant_id) {
      // Decrease variant stock
      await databaseService.products.updateOne(
        {
          _id: new ObjectId(product_id),
          'variants._id': new ObjectId(variant_id)
        },
        {
          $inc: { 'variants.$.stock': -quantity }
        }
      )
    } else {
      // Decrease product stock
      await databaseService.products.updateOne({ _id: new ObjectId(product_id) }, { $inc: { quantity: -quantity } })
    }
  }

  async getProductsForSeller(
    seller_id: string,
    options: {
      limit?: number
      page?: number
      status?: ProductStatus
    } = {}
  ) {
    const { limit = 20, page = 1, status } = options

    const filter: any = {
      seller_id: new ObjectId(seller_id)
    }

    if (status) {
      filter.status = status
    }

    return this.getProducts({
      filter,
      limit,
      page,
      sort: 'created_at',
      order: 'desc'
    })
  }

  async getRelatedProducts(product_id: string, limit = 10) {
    const product = await this.getProductById(product_id)

    if (!product) {
      return []
    }

    // Find products in the same category
    const filter: any = {
      _id: { $ne: new ObjectId(product_id) },
      category_id: product.category_id,
      status: ProductStatus.ACTIVE
    }

    const relatedProducts = await databaseService.products.find(filter).limit(limit).toArray()

    // If not enough related products, find some with same tags
    if (relatedProducts.length < limit && product.tags && product.tags.length > 0) {
      const remainingLimit = limit - relatedProducts.length

      const tagFilter: any = {
        _id: {
          $ne: new ObjectId(product_id),
          $nin: relatedProducts.map((p) => p._id)
        },
        tags: { $in: product.tags },
        status: ProductStatus.ACTIVE
      }

      const tagRelatedProducts = await databaseService.products.find(tagFilter).limit(remainingLimit).toArray()

      relatedProducts.push(...tagRelatedProducts)
    }

    return relatedProducts
  }
}

const productService = new ProductService()
export default productService
