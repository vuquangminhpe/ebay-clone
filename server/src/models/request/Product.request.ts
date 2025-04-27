import { ObjectId } from 'mongodb'
import { ProductCondition, ProductStatus } from '../schemas/Product.schema'
import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface ProductMedia {
  url: string
  type: string
  is_primary: boolean
}

export interface ProductVariant {
  name: string
  price: number
  stock: number
  attributes: Record<string, string>
}

export interface CreateProductReqBody {
  name: string
  description: string
  price: number
  quantity: number
  category_id: string
  condition: ProductCondition
  medias: ProductMedia[]
  tags?: string[]
  variants?: ProductVariant[]
  shipping_price: number
  free_shipping: boolean
}

export interface UpdateProductReqBody {
  name?: string
  description?: string
  price?: number
  quantity?: number
  category_id?: string
  condition?: ProductCondition
  medias?: ProductMedia[]
  tags?: string[]
  variants?: ProductVariant[]
  shipping_price?: number
  free_shipping?: boolean
  status?: ProductStatus
}

export interface ProductParams extends ParamsDictionary {
  product_id: string
}

export interface ProductQuery extends Query {
  page?: string
  limit?: string
  sort?: string
  order?: 'asc' | 'desc'
  category_id?: string
  min_price?: string
  max_price?: string
  condition?: string
  free_shipping?: string
  search?: string
  seller_id?: string
  status?: string
}
