import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { ProductStatus } from '../constants/enums'
import { PRODUCT_MESSAGE } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import {
  CreateProductReqBody,
  ProductParams,
  ProductQuery,
  UpdateProductReqBody
} from '../models/request/Product.request'
import productService from '../services/products.services'
import { UserRole } from '../models/schemas/User.schema'

export const createProductController = async (
  req: Request<ParamsDictionary, any, CreateProductReqBody>,
  res: Response
) => {
  const { user_id, role } = req.decode_authorization as TokenPayload

  // Validate user is a seller
  if (role !== UserRole.SELLER) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: PRODUCT_MESSAGE.SELLER_ONLY
    })
  }

  const result = await productService.createProduct(user_id, req.body)

  return res.status(HTTP_STATUS.CREATED).json({
    message: PRODUCT_MESSAGE.CREATE_PRODUCT_SUCCESS,
    result
  })
}

export const updateProductController = async (
  req: Request<ProductParams, any, UpdateProductReqBody>,
  res: Response
) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { product_id } = req.params

  // Validate user is a seller
  if (role !== UserRole.SELLER) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: PRODUCT_MESSAGE.SELLER_ONLY
    })
  }

  // Validate product belongs to seller
  const product = await productService.getProductById(product_id)
  if (!product) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCT_MESSAGE.PRODUCT_NOT_FOUND
    })
  }

  if (product.seller_id.toString() !== user_id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: PRODUCT_MESSAGE.UNAUTHORIZED_SELLER
    })
  }

  const result = await productService.updateProduct(product_id, req.body)

  return res.status(HTTP_STATUS.OK).json({
    message: PRODUCT_MESSAGE.UPDATE_PRODUCT_SUCCESS,
    result
  })
}

export const deleteProductController = async (req: Request<ProductParams>, res: Response) => {
  const { user_id, role } = req.decode_authorization as TokenPayload
  const { product_id } = req.params

  // Validate user is a seller or admin
  if (role !== UserRole.SELLER && role !== UserRole.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: PRODUCT_MESSAGE.SELLER_ONLY
    })
  }

  // Validate product belongs to seller (unless admin)
  if (role === UserRole.SELLER) {
    const product = await productService.getProductById(product_id)
    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: PRODUCT_MESSAGE.PRODUCT_NOT_FOUND
      })
    }

    if (product.seller_id.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: PRODUCT_MESSAGE.UNAUTHORIZED_SELLER
      })
    }
  }

  // Soft delete by updating status
  await productService.updateProduct(product_id, { status: ProductStatus.DELETED })

  return res.status(HTTP_STATUS.OK).json({
    message: PRODUCT_MESSAGE.DELETE_PRODUCT_SUCCESS
  })
}

export const getProductController = async (req: Request<ProductParams>, res: Response) => {
  const { product_id } = req.params

  const product = await productService.getProductById(product_id)

  if (!product) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCT_MESSAGE.PRODUCT_NOT_FOUND
    })
  }

  // If product is deleted or hidden, only the seller or admin should see it
  if (
    (product.status === ProductStatus.DELETED || product.status === ProductStatus.HIDDEN) &&
    req.decode_authorization
  ) {
    const { user_id, role } = req.decode_authorization as TokenPayload

    if (role !== UserRole.ADMIN && product.seller_id.toString() !== user_id) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: PRODUCT_MESSAGE.PRODUCT_NOT_FOUND
      })
    }
  }

  // Increment views count if viewer is not the seller
  if (req.decode_authorization) {
    const { user_id } = req.decode_authorization as TokenPayload

    if (product.seller_id.toString() !== user_id) {
      await productService.incrementProductViews(product_id)
    }
  } else {
    await productService.incrementProductViews(product_id)
  }

  return res.status(HTTP_STATUS.OK).json({
    message: PRODUCT_MESSAGE.GET_PRODUCT_SUCCESS,
    result: product
  })
}

export const getProductsController = async (req: Request<ParamsDictionary, any, any, ProductQuery>, res: Response) => {
  const {
    page = '1',
    limit = '20',
    sort,
    order = 'desc',
    category_id,
    min_price,
    max_price,
    condition,
    free_shipping,
    search,
    seller_id,
    status
  } = req.query

  // Build filter
  const filter: any = {}

  // Don't show deleted or hidden products to users
  // Unless they are the seller or admin
  if (req.decode_authorization) {
    const { user_id, role } = req.decode_authorization as TokenPayload

    if (role === UserRole.ADMIN) {
      // Admin can see all products with applied status filter
      if (status) {
        filter.status = status
      }
    } else if (role === UserRole.SELLER && seller_id === user_id) {
      // Seller can see all their products with applied status filter
      filter.seller_id = new ObjectId(user_id)
      if (status) {
        filter.status = status
      }
    } else {
      // Default to only active products for other users
      filter.status = ProductStatus.ACTIVE
    }
  } else {
    // Unauthenticated users only see active products
    filter.status = ProductStatus.ACTIVE
  }

  // Apply other filters
  if (category_id) {
    filter.category_id = new ObjectId(category_id)
  }

  if (min_price || max_price) {
    filter.price = {}
    if (min_price) {
      filter.price.$gte = Number(min_price)
    }
    if (max_price) {
      filter.price.$lte = Number(max_price)
    }
  }

  if (condition) {
    filter.condition = condition
  }

  if (free_shipping) {
    filter.free_shipping = free_shipping === 'true'
  }

  if (seller_id && (!req.decode_authorization || req.decode_authorization.user_id !== seller_id)) {
    filter.seller_id = new ObjectId(seller_id)
  }

  if (search) {
    filter.$text = { $search: search }
  }

  const result = await productService.getProducts({
    filter,
    limit: parseInt(limit),
    page: parseInt(page),
    sort,
    order: order as 'asc' | 'desc'
  })

  return res.status(HTTP_STATUS.OK).json({
    message: PRODUCT_MESSAGE.GET_PRODUCTS_SUCCESS,
    result
  })
}

export const getSellerProductsController = async (
  req: Request<ParamsDictionary, any, any, ProductQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { page = '1', limit = '20', sort, order = 'desc', status } = req.query

  // Build filter for seller's products
  const filter: any = {
    seller_id: new ObjectId(user_id)
  }

  if (status) {
    filter.status = status
  }

  const result = await productService.getProducts({
    filter,
    limit: parseInt(limit),
    page: parseInt(page),
    sort,
    order: order as 'asc' | 'desc'
  })

  return res.status(HTTP_STATUS.OK).json({
    message: PRODUCT_MESSAGE.GET_PRODUCTS_SUCCESS,
    result
  })
}
