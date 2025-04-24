import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { STORE_MESSAGE } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import { UserRole } from '../models/schemas/User.schema'
import { StoreStatus } from '../models/schemas/Store.schema'
import storeService from '../services/store.services'
import userService from '../services/users.services'
import productService from '~/services/products.services'

export const createStoreController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { name, description, logo, banner, policy } = req.body

  try {
    // Check if user is already a seller with a store
    const user = await userService.getUserById(user_id)

    if (user?.store_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: STORE_MESSAGE.STORE_ALREADY_EXISTS
      })
    }

    // Create store
    const result = await storeService.createStore({
      seller_id: user_id,
      name,
      description,
      logo,
      banner,
      policy
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: STORE_MESSAGE.CREATE_STORE_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Create store error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Failed to create store'
    })
  }
}

export const updateStoreController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { name, description, logo, banner, policy } = req.body

  try {
    // Get user's store
    const store = await storeService.getStoreByUserId(user_id)

    if (!store) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: STORE_MESSAGE.STORE_NOT_FOUND
      })
    }

    // Update store
    const result = await storeService.updateStore(store._id.toString(), {
      name,
      description,
      logo,
      banner,
      policy
    })

    return res.status(HTTP_STATUS.OK).json({
      message: STORE_MESSAGE.UPDATE_STORE_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Update store error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to update store'
    })
  }
}

export const getStoreController = async (req: Request, res: Response) => {
  const { store_id } = req.params

  try {
    // Get store
    const store = await storeService.getStoreById(store_id)

    if (!store) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: STORE_MESSAGE.STORE_NOT_FOUND
      })
    }

    // Get store owner details
    const seller = await userService.getUserById(store.seller_id.toString())

    // Get store products (most recent)
    const products = await productService.getProducts({
      filter: {
        seller_id: store.seller_id,
        status: 'active'
      },
      limit: 10,
      page: 1,
      sort: 'created_at',
      order: 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: STORE_MESSAGE.GET_STORE_SUCCESS,
      result: {
        store,
        seller: {
          _id: seller?._id,
          name: seller?.name,
          username: seller?.username,
          avatar: seller?.avatar,
          is_seller_verified: seller?.is_seller_verified
        },
        featured_products: products.products
      }
    })
  } catch (error) {
    console.error('Get store error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get store'
    })
  }
}

export const getStoreBySellerController = async (req: Request, res: Response) => {
  const { seller_id } = req.params

  try {
    // Get store by seller
    const store = await storeService.getStoreByUserId(seller_id)

    if (!store) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: STORE_MESSAGE.STORE_NOT_FOUND
      })
    }

    // Get store owner details
    const seller = await userService.getUserById(seller_id)

    // Get store products (most recent)
    const products = await productService.getProducts({
      filter: {
        seller_id: new ObjectId(seller_id),
        status: 'active'
      },
      limit: 10,
      page: 1,
      sort: 'created_at',
      order: 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: STORE_MESSAGE.GET_STORE_SUCCESS,
      result: {
        store,
        seller: {
          _id: seller?._id,
          name: seller?.name,
          username: seller?.username,
          avatar: seller?.avatar,
          is_seller_verified: seller?.is_seller_verified
        },
        featured_products: products.products
      }
    })
  } catch (error) {
    console.error('Get store by seller error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get store'
    })
  }
}

export const getMyStoreController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  try {
    // Get store
    const store = await storeService.getStoreByUserId(user_id)

    if (!store) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: STORE_MESSAGE.STORE_NOT_FOUND
      })
    }

    // Get store products with all statuses for the seller
    const products = await productService.getProductsForSeller(user_id)

    return res.status(HTTP_STATUS.OK).json({
      message: STORE_MESSAGE.GET_STORE_SUCCESS,
      result: {
        store,
        products: products.products,
        pagination: products.pagination
      }
    })
  } catch (error) {
    console.error('Get my store error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get store'
    })
  }
}

export const getStoresController = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', sort = 'rating', order = 'desc', search } = req.query

  try {
    let result

    if (search) {
      // Search stores
      result = await storeService.searchStores(search as string, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      })
    } else {
      // Get all active stores
      result = await storeService.getStores({
        filter: { status: StoreStatus.ACTIVE },
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string,
        order: order as 'asc' | 'desc'
      })
    }

    return res.status(HTTP_STATUS.OK).json({
      message: STORE_MESSAGE.GET_STORES_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Get stores error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get stores'
    })
  }
}

export const getStoreProductsController = async (req: Request, res: Response) => {
  const { store_id } = req.params
  const { page = '1', limit = '20', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Get store
    const store = await storeService.getStoreById(store_id)

    if (!store) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: STORE_MESSAGE.STORE_NOT_FOUND
      })
    }

    // Get store products
    const products = await productService.getProducts({
      filter: {
        seller_id: store.seller_id,
        status: 'active'
      },
      limit: parseInt(limit as string),
      page: parseInt(page as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Get store products success',
      result: {
        store: {
          _id: store._id,
          name: store.name,
          rating: store.rating
        },
        products: products.products,
        pagination: products.pagination
      }
    })
  } catch (error) {
    console.error('Get store products error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get store products'
    })
  }
}

export const upgradeToSellerController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  try {
    // Get user
    const user = await userService.getUserById(user_id)

    if (user?.role === UserRole.SELLER) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'User is already a seller'
      })
    }

    // Update user role to seller
    await userService.updateUser(user_id, {
      role: UserRole.SELLER
    })

    return res.status(HTTP_STATUS.OK).json({
      message: STORE_MESSAGE.SWITCH_TO_SELLER_SUCCESS
    })
  } catch (error) {
    console.error('Upgrade to seller error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to upgrade to seller'
    })
  }
}

export const getTopStoresController = async (req: Request, res: Response) => {
  try {
    const topStores = await storeService.getTopStores(5)

    return res.status(HTTP_STATUS.OK).json({
      message: STORE_MESSAGE.GET_STORES_SUCCESS,
      result: topStores
    })
  } catch (error) {
    console.error('Get top stores error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get top stores'
    })
  }
}
