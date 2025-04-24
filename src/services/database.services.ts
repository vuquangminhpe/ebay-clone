import { MongoClient, Db, Collection } from 'mongodb'
import User from '../models/schemas/User.schema'

// Import new schemas for eBay clone
import Product from '../models/schemas/Product.schema'
import Order from '../models/schemas/Order.schema'
import Cart from '../models/schemas/Cart.schema'
import Category from '../models/schemas/Category.schema'
import Store from '../models/schemas/Store.schema'
import Review from '../models/schemas/Review.schema'
import Coupon from '../models/schemas/Coupon.schema'
import Dispute from '../models/schemas/Dispute.schema'
import { envConfig } from '~/constants/config'
import Address from '~/models/schemas/Address.chema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'

const uri = envConfig.mongodb_url
const dbName = envConfig.db_name

class DatabaseService {
  private static instance: DatabaseService
  private client: MongoClient
  public db: Db

  private constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(dbName)
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async connect() {
    try {
      await this.client.connect() // Kết nối nếu chưa có
      await this.db.command({ ping: 1 })
      console.log('Connected to MongoDB!')
    } catch (error) {
      console.error('MongoDB connection error:', error)
      throw error
    }
  }

  async indexUsers() {
    const exits = await this.users.indexExists(['email_1_password_1', 'email_1'])
    if (!exits) {
      this.users.createIndex({ email: 1, password: 1 }, { unique: true })
      this.users.createIndex({ email: 1 }, { unique: true })
    }
  }

  // New indexes for eBay clone
  async indexProducts() {
    const existsNameIndex = await this.products.indexExists('name_text_description_text')
    if (!existsNameIndex) {
      this.products.createIndex({ name: 'text', description: 'text', tags: 'text' })
    }

    const existsCategoryIndex = await this.products.indexExists('category_id_1')
    if (!existsCategoryIndex) {
      this.products.createIndex({ category_id: 1 })
    }

    const existsSellerIndex = await this.products.indexExists('seller_id_1')
    if (!existsSellerIndex) {
      this.products.createIndex({ seller_id: 1 })
    }

    const existsPriceIndex = await this.products.indexExists('price_1')
    if (!existsPriceIndex) {
      this.products.createIndex({ price: 1 })
    }
  }

  async indexOrders() {
    const existsBuyerIndex = await this.orders.indexExists('buyer_id_1')
    if (!existsBuyerIndex) {
      this.orders.createIndex({ buyer_id: 1 })
    }

    const existsOrderNumberIndex = await this.orders.indexExists('order_number_1')
    if (!existsOrderNumberIndex) {
      this.orders.createIndex({ order_number: 1 }, { unique: true })
    }

    const existsSellerItems = await this.orders.indexExists('items.seller_id_1')
    if (!existsSellerItems) {
      this.orders.createIndex({ 'items.seller_id': 1 })
    }
  }

  async indexAddresses() {
    const existsUserIndex = await this.addresses.indexExists('user_id_1')
    if (!existsUserIndex) {
      this.addresses.createIndex({ user_id: 1 })
    }
  }

  async indexReviews() {
    const existsProductIndex = await this.reviews.indexExists('product_id_1')
    if (!existsProductIndex) {
      this.reviews.createIndex({ product_id: 1 })
    }

    const existsSellerIndex = await this.reviews.indexExists('seller_id_1')
    if (!existsSellerIndex) {
      this.reviews.createIndex({ seller_id: 1 })
    }
  }

  async indexCoupons() {
    const existsCodeIndex = await this.coupons.indexExists('code_1')
    if (!existsCodeIndex) {
      this.coupons.createIndex({ code: 1 }, { unique: true })
    }
  }

  // Original collections
  get users(): Collection<User> {
    return this.db.collection(envConfig.usersCollection)
  }
  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection('videoStatus')
  }
  // New collections for eBay clone
  get products(): Collection<Product> {
    return this.db.collection('products')
  }
  get orders(): Collection<Order> {
    return this.db.collection('orders')
  }
  get addresses(): Collection<Address> {
    return this.db.collection('addresses')
  }
  get carts(): Collection<Cart> {
    return this.db.collection('carts')
  }
  get categories(): Collection<Category> {
    return this.db.collection('categories')
  }
  get stores(): Collection<Store> {
    return this.db.collection('stores')
  }
  get reviews(): Collection<Review> {
    return this.db.collection('reviews')
  }
  get coupons(): Collection<Coupon> {
    return this.db.collection('coupons')
  }
  get disputes(): Collection<Dispute> {
    return this.db.collection('disputes')
  }
}

const databaseService = DatabaseService.getInstance()
databaseService.connect().catch(console.error)
export default databaseService
