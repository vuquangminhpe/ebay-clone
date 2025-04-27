import { Product } from './type'

export interface ErrorResponse<Data> {
  status_message: string
  status_code: string
  results: Data
}

export interface SuccessResponse<Data> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: Data
}

export interface user_info_comment {
  avatar: string
  username: string
}

export interface ProductListResponse {
  products: Product[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
