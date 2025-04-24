import { ObjectId } from 'mongodb'

interface CategoryType {
  _id?: ObjectId
  name: string
  slug: string
  description?: string
  parent_id?: ObjectId
  image_url?: string
  is_active: boolean
  created_at?: Date
  updated_at?: Date
}

export default class Category {
  _id?: ObjectId
  name: string
  slug: string
  description?: string
  parent_id?: ObjectId
  image_url?: string
  is_active: boolean
  created_at: Date
  updated_at: Date

  constructor({ _id, name, slug, description, parent_id, image_url, is_active, created_at, updated_at }: CategoryType) {
    const date = new Date()
    this._id = _id
    this.name = name
    this.slug = slug
    this.description = description
    this.parent_id = parent_id
    this.image_url = image_url
    this.is_active = is_active
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
