import { Category } from './type'

export interface CreateCategoryRequest {
  name: string
  description?: string
  parent_id?: string
  image_url?: string
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  parent_id?: string | null
  image_url?: string
  is_active?: boolean
}

export interface CategoryTree extends Category {
  children: CategoryTree[]
}
