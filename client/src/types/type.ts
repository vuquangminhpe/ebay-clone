// Product-related types for the eBay clone frontend

// Basic product interface
export interface Product {
  _id: string
  seller_id: string
  name: string
  description: string
  price: number
  quantity: number
  category_id: string
  condition: ProductCondition
  status: ProductStatus
  medias: ProductMedia[]
  tags?: string[]
  variants?: ProductVariant[]
  shipping_price?: number
  free_shipping: boolean
  rating?: number
  total_reviews?: number
  views: number
  created_at: string
  updated_at: string
  seller?: {
    _id: string
    name: string
    username: string
    avatar?: string
    is_seller_verified?: boolean
  }
}

// Product enums
export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  VERY_GOOD = 'very_good',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  FOR_PARTS = 'for_parts'
}

export enum ProductStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  DELETED = 'deleted',
  SOLD_OUT = 'sold_out',
  DRAFT = 'draft'
}

// Product media
export interface ProductMedia {
  url: string
  type: MediaType
  is_primary?: boolean
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  HLS = 'hls'
}

// Product variants
export interface ProductVariant {
  _id?: string
  attributes: Record<string, string>
  price: number
  stock: number
  sku?: string
}

// Category
export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

export interface CategoryWithBreadcrumbs {
  category: Category
  children: Category[]
  breadcrumbs: {
    _id: string
    name: string
    slug: string
  }[]
}

export interface CategoryWithProducts {
  category: {
    _id: string
    name: string
    slug: string
    description?: string
    image_url?: string
  }
  breadcrumbs: {
    _id: string
    name: string
    slug: string
  }[]
  children: Category[]
  products: Product[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Request types for products
export interface CreateProductRequest {
  name: string
  description: string
  price: number
  quantity: number
  category_id: string
  condition: ProductCondition
  medias: ProductMedia[]
  tags?: string[]
  variants?: ProductVariant[]
  shipping_price?: number
  free_shipping?: boolean
}

export interface UpdateProductRequest {
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

// Response types for products
export interface ProductsResponse {
  products: Product[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface RelatedProductsResponse {
  products: Product[]
}

// Query parameters for products
export interface ProductsQueryParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  category_id?: string
  min_price?: number
  max_price?: number
  condition?: ProductCondition
  free_shipping?: boolean
  search?: string
  seller_id?: string
  status?: ProductStatus
}
