import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Cart, { CartItem } from '../models/schemas/Cart.schema'
import productService from './products.services'

class CartService {
  async getCart(user_id: string) {
    // Find existing cart or create a new one
    let cart = await databaseService.carts.findOne({ user_id: new ObjectId(user_id) })

    if (!cart) {
      cart = new Cart({
        user_id: new ObjectId(user_id),
        items: []
      })

      await databaseService.carts.insertOne(cart)
    }

    // Enrich cart with product details
    if (cart.items.length > 0) {
      const productIds = cart.items.map((item) => item.product_id)
      const products = await productService.getProductsByIds(productIds)

      // Create a map for quick lookup
      const productMap = new Map(products.map((p) => [p._id.toString(), p]))

      // Add product details to cart items
      const enrichedItems = cart.items.map((item) => {
        const product = productMap.get(item.product_id.toString())
        return {
          ...item,
          product_name: product?.name || 'Product not available',
          product_image: product?.medias?.find((m) => m.is_primary)?.url || '',
          available: product ? true : false,
          in_stock: item.variant_id
            ? (product?.variants?.find((v) => v._id?.toString() === item.variant_id?.toString())?.stock || 0) >=
              item.quantity
            : (product?.quantity || 0) >= item.quantity,
          current_price: product?.price || 0
        }
      })

      return {
        ...cart,
        items: enrichedItems,
        subtotal: enrichedItems
          .filter((item) => item.selected && item.available && item.in_stock)
          .reduce((sum, item) => sum + item.price * item.quantity, 0)
      }
    }

    return cart
  }

  async addToCart(user_id: string, cartItem: CartItem) {
    // Find existing cart or create a new one
    let cart = await databaseService.carts.findOne({ user_id: new ObjectId(user_id) })

    if (!cart) {
      cart = new Cart({
        user_id: new ObjectId(user_id),
        items: []
      })

      await databaseService.carts.insertOne(cart)
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product_id.toString() === cartItem.product_id.toString() &&
        ((!item.variant_id && !cartItem.variant_id) || item.variant_id?.toString() === cartItem.variant_id?.toString())
    )

    if (existingItemIndex !== -1) {
      // Update quantity if product already exists
      await databaseService.carts.updateOne(
        {
          user_id: new ObjectId(user_id),
          'items.product_id': cartItem.product_id
        },
        {
          $set: {
            [`items.${existingItemIndex}.quantity`]: cart.items[existingItemIndex].quantity + cartItem.quantity,
            [`items.${existingItemIndex}.selected`]: true,
            updated_at: new Date()
          }
        }
      )
    } else {
      // Add new item to cart
      await databaseService.carts.updateOne(
        { user_id: new ObjectId(user_id) },
        {
          $push: { items: cartItem },
          $set: { updated_at: new Date() }
        }
      )
    }

    return this.getCart(user_id)
  }

  async updateCartItem(
    user_id: string,
    product_id: string,
    updates: {
      quantity?: number
      selected?: boolean
    }
  ) {
    const updateData: any = { updated_at: new Date() }

    if (updates.quantity !== undefined) {
      updateData['items.$.quantity'] = updates.quantity
    }

    if (updates.selected !== undefined) {
      updateData['items.$.selected'] = updates.selected
    }

    await databaseService.carts.updateOne(
      {
        user_id: new ObjectId(user_id),
        'items.product_id': new ObjectId(product_id)
      },
      { $set: updateData }
    )

    return this.getCart(user_id)
  }

  async removeFromCart(user_id: string, product_id: string) {
    await databaseService.carts.updateOne(
      { user_id: new ObjectId(user_id) },
      {
        $pull: { items: { product_id: new ObjectId(product_id) } },
        $set: { updated_at: new Date() }
      }
    )

    return this.getCart(user_id)
  }

  async clearCart(user_id: string) {
    await databaseService.carts.updateOne(
      { user_id: new ObjectId(user_id) },
      {
        $set: {
          items: [],
          coupon_code: null,
          updated_at: new Date()
        }
      }
    )

    return this.getCart(user_id)
  }

  async applyCoupon(user_id: string, coupon_code: string) {
    await databaseService.carts.updateOne(
      { user_id: new ObjectId(user_id) },
      {
        $set: {
          coupon_code,
          updated_at: new Date()
        }
      }
    )

    return this.getCart(user_id)
  }

  async removeCoupon(user_id: string) {
    await databaseService.carts.updateOne(
      { user_id: new ObjectId(user_id) },
      {
        $set: {
          coupon_code: null,
          updated_at: new Date()
        }
      }
    )

    return this.getCart(user_id)
  }

  async removeOrderedItems(user_id: string, product_ids: string[]) {
    await databaseService.carts.updateOne(
      { user_id: new ObjectId(user_id) },
      {
        $pull: {
          items: {
            product_id: {
              $in: product_ids.map((id) => new ObjectId(id))
            }
          }
        },
        $set: { updated_at: new Date() }
      }
    )

    return this.getCart(user_id)
  }

  async calculateCartTotal(user_id: string) {
    const cart = await this.getCart(user_id)

    // Calculate subtotal from selected items that are available and in stock
    const selectedItems = cart.items.filter((item) => item.selected && item.available && item.in_stock)

    const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Calculate shipping
    // In a real app, this would likely be more complex based on location, weight, etc.
    let shipping = selectedItems.length > 0 ? 5 : 0 // Default shipping cost

    // Check if all items have free shipping
    const allFreeShipping =
      selectedItems.length > 0 &&
      selectedItems.every((item) => {
        const product = cart?.products?.find((p) => p._id.toString() === item.product_id.toString())
        return product?.free_shipping
      })

    if (allFreeShipping) {
      shipping = 0
    }

    // Calculate tax (simplified example)
    const taxRate = 0.1 // 10%
    const tax = subtotal * taxRate

    // Apply coupon if exists
    let discount = 0
    if (cart?.coupon_code) {
      const coupon = await couponService.getCouponByCode(cart.coupon_code)

      if (coupon && coupon.is_active) {
        // Check if coupon is valid
        const now = new Date()
        const couponValid = now >= coupon.starts_at && now <= coupon.expires_at

        if (couponValid) {
          // Calculate discount based on coupon type
          if (coupon.type === 'percentage') {
            discount = subtotal * (coupon.value / 100)

            // Apply max discount if specified
            if (coupon.max_discount && discount > coupon.max_discount) {
              discount = coupon.max_discount
            }
          } else {
            // fixed amount
            discount = coupon.value

            // Don't exceed subtotal
            if (discount > subtotal) {
              discount = subtotal
            }
          }
        }
      }
    }

    // Calculate total
    const total = subtotal + shipping + tax - discount

    return {
      subtotal,
      shipping,
      tax,
      discount,
      total,
      items_count: selectedItems.length,
      total_items: selectedItems.reduce((sum, item) => sum + item.quantity, 0)
    }
  }
}

const cartService = new CartService()
export default cartService
