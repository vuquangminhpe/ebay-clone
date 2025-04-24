import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Category from '../models/schemas/Category.schema'

class CategoryService {
  async createCategory({
    name,
    description,
    parent_id,
    image_url
  }: {
    name: string
    description?: string
    parent_id?: string
    image_url?: string
  }) {
    // Generate slug from name
    const slug = this.generateSlug(name)

    // Check if slug already exists
    const existingCategory = await databaseService.categories.findOne({ slug })
    if (existingCategory) {
      throw new Error('Category with this slug already exists')
    }

    // Create category
    const category = new Category({
      name,
      slug,
      description,
      parent_id: parent_id ? new ObjectId(parent_id) : undefined,
      image_url,
      is_active: true
    })

    const result = await databaseService.categories.insertOne(category)

    return { ...category, _id: result.insertedId }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async updateCategory(
    category_id: string,
    {
      name,
      description,
      parent_id,
      image_url,
      is_active
    }: {
      name?: string
      description?: string
      parent_id?: string | null
      image_url?: string
      is_active?: boolean
    }
  ) {
    const updateData: any = {}

    // Only include fields that are provided in the payload
    if (name !== undefined) {
      updateData.name = name
      updateData.slug = this.generateSlug(name)

      // Check if new slug already exists (not including this category)
      if (updateData.slug) {
        const existingCategory = await databaseService.categories.findOne({
          slug: updateData.slug,
          _id: { $ne: new ObjectId(category_id) }
        })

        if (existingCategory) {
          throw new Error('Category with this slug already exists')
        }
      }
    }

    if (description !== undefined) updateData.description = description

    if (parent_id !== undefined) {
      if (parent_id === null) {
        updateData.parent_id = null
      } else {
        // Validate parent_id
        if (!ObjectId.isValid(parent_id)) {
          throw new Error('Invalid parent category ID')
        }

        // Check parent exists
        const parentCategory = await databaseService.categories.findOne({
          _id: new ObjectId(parent_id)
        })

        if (!parentCategory) {
          throw new Error('Parent category not found')
        }

        // Check for circular reference
        if (parent_id === category_id) {
          throw new Error('Category cannot be its own parent')
        }

        // Check if parent_id would create a circular reference in the category hierarchy
        const isCircular = await this.checkCircularReference(parent_id, category_id)
        if (isCircular) {
          throw new Error('Creating this parent-child relationship would create a circular reference')
        }

        updateData.parent_id = new ObjectId(parent_id)
      }
    }

    if (image_url !== undefined) updateData.image_url = image_url
    if (is_active !== undefined) updateData.is_active = is_active

    // Add updated_at timestamp
    updateData.updated_at = new Date()

    await databaseService.categories.findOneAndUpdate({ _id: new ObjectId(category_id) }, { $set: updateData })

    return this.getCategoryById(category_id)
  }

  private async checkCircularReference(parentId: string, childId: string): Promise<boolean> {
    // Check if child is a parent of parent (circular reference)
    const queue: string[] = [childId]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const currentId = queue.shift() as string

      if (visited.has(currentId)) {
        continue
      }

      visited.add(currentId)

      // Find all categories with this parent
      const children = await databaseService.categories.find({ parent_id: new ObjectId(currentId) }).toArray()

      for (const child of children) {
        if (child._id.toString() === parentId) {
          return true // Circular reference found
        }

        queue.push(child._id.toString())
      }
    }

    return false
  }

  async getCategoryById(category_id: string) {
    return databaseService.categories.findOne({ _id: new ObjectId(category_id) })
  }

  async getCategoryBySlug(slug: string) {
    return databaseService.categories.findOne({ slug })
  }

  async getCategories({
    filter = {},
    limit = 100,
    page = 1,
    sort = 'name',
    order = 'asc'
  }: {
    filter?: any
    limit?: number
    page?: number
    sort?: string
    order?: 'asc' | 'desc'
  } = {}) {
    const skip = (page - 1) * limit

    // Create sort options
    const sortOption: any = {}
    sortOption[sort] = order === 'asc' ? 1 : -1

    // Get total count
    const total = await databaseService.categories.countDocuments(filter)

    // Get categories
    const categories = await databaseService.categories.find(filter).sort(sortOption).skip(skip).limit(limit).toArray()

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return {
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  }

  async getRootCategories(activeOnly: boolean = true) {
    const filter: any = {
      parent_id: null
    }

    if (activeOnly) {
      filter.is_active = true
    }

    return databaseService.categories.find(filter).sort({ name: 1 }).toArray()
  }

  async getChildCategories(parent_id: string, activeOnly: boolean = true) {
    const filter: any = {
      parent_id: new ObjectId(parent_id)
    }

    if (activeOnly) {
      filter.is_active = true
    }

    return databaseService.categories.find(filter).sort({ name: 1 }).toArray()
  }

  async getCategoryTree(includeInactive: boolean = false) {
    // Get all categories
    const filter: any = {}
    if (!includeInactive) {
      filter.is_active = true
    }

    const allCategories = await databaseService.categories.find(filter).sort({ name: 1 }).toArray()

    // Build tree
    const rootCategories = allCategories.filter((c) => !c.parent_id)
    const categoryMap = new Map(allCategories.map((c) => [c._id.toString(), { ...c, children: [] }]))

    // Add children to their parents
    allCategories.forEach((category) => {
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id.toString())
        if (parent) {
          parent.children.push(categoryMap.get(category._id.toString()))
        }
      }
    })

    return rootCategories.map((c) => categoryMap.get(c._id.toString()))
  }

  async getCategoryBreadcrumbs(category_id: string) {
    const breadcrumbs = []
    let currentCategory = await this.getCategoryById(category_id)

    if (!currentCategory) {
      return []
    }

    breadcrumbs.unshift({
      _id: currentCategory._id,
      name: currentCategory.name,
      slug: currentCategory.slug
    })

    // Traverse up the category hierarchy
    while (currentCategory.parent_id) {
      currentCategory = await this.getCategoryById(currentCategory.parent_id.toString())

      if (!currentCategory) {
        break
      }

      breadcrumbs.unshift({
        _id: currentCategory._id,
        name: currentCategory.name,
        slug: currentCategory.slug
      })
    }

    return breadcrumbs
  }

  async getProductCountsByCategory(includeInactive: boolean = false) {
    const pipeline = [
      {
        $match: {
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$category_id',
          count: { $sum: 1 }
        }
      }
    ]

    const productCounts = await databaseService.products.aggregate(pipeline).toArray()

    // Get all categories
    const filter: any = {}
    if (!includeInactive) {
      filter.is_active = true
    }

    const categories = await databaseService.categories.find(filter).toArray()

    // Create a map of product counts by category ID
    const countMap = new Map(productCounts.map((item) => [item._id.toString(), item.count]))

    // Add count to each category
    return categories.map((category) => ({
      _id: category._id,
      name: category.name,
      slug: category.slug,
      product_count: countMap.get(category._id.toString()) || 0,
      parent_id: category.parent_id
    }))
  }
}

const categoryService = new CategoryService()
export default categoryService
