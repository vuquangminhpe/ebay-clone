import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { CATEGORY_MESSAGE } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import { UserRole } from '../models/schemas/User.schema'
import categoryService from '../services/category.services'
import productService from '~/services/products.services'

export const createCategoryController = async (req: Request, res: Response) => {
  const { role } = req.decode_authorization as TokenPayload
  const { name, description, parent_id, image_url } = req.body

  // Only admin can create categories
  if (role !== UserRole.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: CATEGORY_MESSAGE.ADMIN_ONLY
    })
  }

  try {
    // Create category
    const result = await categoryService.createCategory({
      name,
      description,
      parent_id,
      image_url
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: CATEGORY_MESSAGE.CREATE_CATEGORY_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Create category error:', error)
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error instanceof Error ? error.message : 'Failed to create category'
    })
  }
}

export const updateCategoryController = async (req: Request, res: Response) => {
  const { role } = req.decode_authorization as TokenPayload
  const { category_id } = req.params
  const { name, description, parent_id, image_url, is_active } = req.body

  // Only admin can update categories
  if (role !== UserRole.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: CATEGORY_MESSAGE.ADMIN_ONLY
    })
  }

  try {
    // Check if category exists
    const category = await categoryService.getCategoryById(category_id)
    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: CATEGORY_MESSAGE.CATEGORY_NOT_FOUND
      })
    }

    // Update category
    const result = await categoryService.updateCategory(category_id, {
      name,
      description,
      parent_id,
      image_url,
      is_active
    })

    return res.status(HTTP_STATUS.OK).json({
      message: CATEGORY_MESSAGE.UPDATE_CATEGORY_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Update category error:', error)
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error instanceof Error ? error.message : 'Failed to update category'
    })
  }
}

export const getCategoryController = async (req: Request, res: Response) => {
  const { category_id } = req.params

  try {
    // Get category
    const category = await categoryService.getCategoryById(category_id)

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: CATEGORY_MESSAGE.CATEGORY_NOT_FOUND
      })
    }

    // Get child categories
    const children = await categoryService.getChildCategories(category_id)

    // Get breadcrumbs
    const breadcrumbs = await categoryService.getCategoryBreadcrumbs(category_id)

    return res.status(HTTP_STATUS.OK).json({
      message: CATEGORY_MESSAGE.GET_CATEGORY_SUCCESS,
      result: {
        category,
        children,
        breadcrumbs
      }
    })
  } catch (error) {
    console.error('Get category error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get category'
    })
  }
}

export const getCategoryBySlugController = async (req: Request, res: Response) => {
  const { slug } = req.params

  try {
    // Get category
    const category = await categoryService.getCategoryBySlug(slug)

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: CATEGORY_MESSAGE.CATEGORY_NOT_FOUND
      })
    }

    // Get child categories
    const children = await categoryService.getChildCategories(category._id.toString())

    // Get breadcrumbs
    const breadcrumbs = await categoryService.getCategoryBreadcrumbs(category._id.toString())

    return res.status(HTTP_STATUS.OK).json({
      message: CATEGORY_MESSAGE.GET_CATEGORY_SUCCESS,
      result: {
        category,
        children,
        breadcrumbs
      }
    })
  } catch (error) {
    console.error('Get category by slug error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get category'
    })
  }
}

export const getCategoriesController = async (req: Request, res: Response) => {
  const { include_inactive = 'false' } = req.query

  try {
    // Get all categories
    const result = await categoryService.getCategories({
      filter: include_inactive === 'true' ? {} : { is_active: true },
      sort: 'name',
      order: 'asc'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: CATEGORY_MESSAGE.GET_CATEGORIES_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Get categories error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get categories'
    })
  }
}

export const getCategoryTreeController = async (req: Request, res: Response) => {
  const { include_inactive = 'false' } = req.query

  try {
    // Get category tree
    const result = await categoryService.getCategoryTree(include_inactive === 'true')

    return res.status(HTTP_STATUS.OK).json({
      message: CATEGORY_MESSAGE.GET_CATEGORIES_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Get category tree error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get category tree'
    })
  }
}

export const getCategoryProductsController = async (req: Request, res: Response) => {
  const { category_id } = req.params
  const { page = '1', limit = '20', sort = 'created_at', order = 'desc' } = req.query

  try {
    // Check if category exists
    const category = await categoryService.getCategoryById(category_id)

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: CATEGORY_MESSAGE.CATEGORY_NOT_FOUND
      })
    }

    // Get category products
    const products = await productService.getProducts({
      filter: {
        category_id: new ObjectId(category_id),
        status: 'active'
      },
      limit: parseInt(limit as string),
      page: parseInt(page as string),
      sort: sort as string,
      order: order as 'asc' | 'desc'
    })

    // Get breadcrumbs
    const breadcrumbs = await categoryService.getCategoryBreadcrumbs(category_id)

    // Get child categories
    const children = await categoryService.getChildCategories(category_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Get category products success',
      result: {
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image_url: category.image_url
        },
        breadcrumbs,
        children,
        products: products.products,
        pagination: products.pagination
      }
    })
  } catch (error) {
    console.error('Get category products error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get category products'
    })
  }
}

export const getRootCategoriesController = async (req: Request, res: Response) => {
  const { include_inactive = 'false' } = req.query

  try {
    // Get root categories
    const categories = await categoryService.getRootCategories(include_inactive !== 'true')

    return res.status(HTTP_STATUS.OK).json({
      message: CATEGORY_MESSAGE.GET_CATEGORIES_SUCCESS,
      result: categories
    })
  } catch (error) {
    console.error('Get root categories error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get root categories'
    })
  }
}

export const getChildCategoriesController = async (req: Request, res: Response) => {
  const { parent_id } = req.params
  const { include_inactive = 'false' } = req.query

  try {
    // Check if parent category exists
    const parentCategory = await categoryService.getCategoryById(parent_id)

    if (!parentCategory) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: CATEGORY_MESSAGE.CATEGORY_NOT_FOUND
      })
    }

    // Get child categories
    const categories = await categoryService.getChildCategories(parent_id, include_inactive !== 'true')

    return res.status(HTTP_STATUS.OK).json({
      message: CATEGORY_MESSAGE.GET_CATEGORIES_SUCCESS,
      result: categories
    })
  } catch (error) {
    console.error('Get child categories error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get child categories'
    })
  }
}

export const getCategoryProductCountsController = async (req: Request, res: Response) => {
  const { include_inactive = 'false' } = req.query

  try {
    // Get product counts by category
    const result = await categoryService.getProductCountsByCategory(include_inactive === 'true')

    return res.status(HTTP_STATUS.OK).json({
      message: CATEGORY_MESSAGE.GET_CATEGORIES_SUCCESS,
      result
    })
  } catch (error) {
    console.error('Get category product counts error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get category product counts'
    })
  }
}
