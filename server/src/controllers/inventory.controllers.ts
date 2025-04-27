// src/controllers/inventory.controllers.ts
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import inventoryService from '../services/inventory.services'
import { UserRole } from '../models/schemas/User.schema'
import productService from '../services/products.services'

// Define request body interfaces
interface CreateInventoryReqBody {
  product_id: string
  quantity: number
  sku?: string
  location?: string
}

interface UpdateInventoryReqBody {
  quantity?: number
  sku?: string
  location?: string
  reserved_quantity?: number
}

// Define request params interface
interface InventoryParams extends ParamsDictionary {
  product_id: string
}

export const createInventoryController = async (
  req: Request<ParamsDictionary, any, CreateInventoryReqBody>,
  res: Response
) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { product_id, quantity, sku, location } = req.body

  try {
    // Verify user is a seller
    if (role !== UserRole.SELLER) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Only sellers can manage inventory'
      })
    }

    // Verify product belongs to this seller
    const product = await productService.getProductById(product_id)
    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Product not found'
      })
    }

    if (product.seller_id.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'You can only manage inventory for your own products'
      })
    }

    // Create inventory
    const result = await inventoryService.createInventory({
      product_id,
      quantity,
      sku,
      location
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Inventory created successfully',
      result
    })
  } catch (error) {
    console.error('Create inventory error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to create inventory'
    })
  }
}

export const updateInventoryController = async (
  req: Request<InventoryParams, any, UpdateInventoryReqBody>,
  res: Response
) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { product_id } = req.params
  const { quantity, sku, location, reserved_quantity } = req.body

  try {
    // Verify user is a seller
    if (role !== UserRole.SELLER && role !== UserRole.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Only sellers and admins can update inventory'
      })
    }

    // If user is a seller, verify product belongs to them
    if (role === UserRole.SELLER) {
      const product = await productService.getProductById(product_id)
      if (!product) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Product not found'
        })
      }

      if (product.seller_id.toString() !== user_id) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: 'You can only update inventory for your own products'
        })
      }
    }

    // Update inventory
    const result = await inventoryService.updateInventory(product_id, {
      quantity,
      sku,
      location,
      reserved_quantity
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Inventory updated successfully',
      result
    })
  } catch (error) {
    console.error('Update inventory error:', error)
    return res.status(error instanceof Error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to update inventory'
    })
  }
}

export const getInventoryController = async (req: Request<InventoryParams>, res: Response) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { product_id } = req.params

  try {
    // If user is a seller, verify product belongs to them
    if (role === UserRole.SELLER) {
      const product = await productService.getProductById(product_id)
      if (!product) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Product not found'
        })
      }

      if (product.seller_id.toString() !== user_id) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: 'You can only view inventory for your own products'
        })
      }
    }

    // Get inventory
    const inventory = await inventoryService.getInventoryByProductId(product_id)

    if (!inventory) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Inventory not found'
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Inventory retrieved successfully',
      result: {
        ...inventory,
        available_quantity: inventory.quantity - inventory.reserved_quantity
      }
    })
  } catch (error) {
    console.error('Get inventory error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get inventory'
    })
  }
}

export const getSellerInventoryController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { page = '1', limit = '20', sort = 'updated_at', order = 'desc' } = req.query

  try {
    // Get seller inventory
    const result = await inventoryService.getSellerInventory(user_id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Seller inventory retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get seller inventory error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get seller inventory'
    })
  }
}

export const getLowStockProductsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { threshold = '5' } = req.query

  try {
    // Get seller inventory with low stock
    const products = await inventoryService.getLowStockProducts(parseInt(threshold as string))

    // Filter to only include products owned by this seller
    const sellerProducts = await Promise.all(
      products.map(async (inventory) => {
        const product = await productService.getProductById(inventory.product_id.toString())
        if (product && product.seller_id.toString() === user_id) {
          return {
            ...inventory,
            product: {
              _id: product._id,
              name: product.name,
              price: product.price,
              image: product.medias?.find((m: any) => m.is_primary)?.url || product.medias?.[0]?.url || ''
            },
            available_quantity: inventory.quantity - inventory.reserved_quantity
          }
        }
        return null
      })
    )

    const filteredProducts = sellerProducts.filter((p) => p !== null)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Low stock products retrieved successfully',
      result: filteredProducts
    })
  } catch (error) {
    console.error('Get low stock products error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get low stock products'
    })
  }
}
