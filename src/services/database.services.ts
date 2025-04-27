import { MongoClient, Db, Collection } from 'mongodb'
import User from '../models/schemas/User.schema'

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
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Bid from '../models/schemas/Bid.schema'
import Inventory from '../models/schemas/Inventory.schema'
import Feedback from '../models/schemas/Feedback.schema'
import Message from '../models/schemas/Message.schema'
import ReturnRequest from '../models/schemas/ReturnRequest.schema'
import PaymentMethod from '../models/schemas/PaymentMethod.schema'
import ShippingMethod from '../models/schemas/ShippingMethod.schema'
import Transaction from '../models/schemas/Transaction.schema'
import Shipment from '../models/schemas/Shipment.schema'
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
    const existsUserIdIndex = await this.addresses.indexExists('user_id_1')
    if (!existsUserIdIndex) {
      this.addresses.createIndex({ user_id: 1 })
    }

    // Thêm geospatial index
    const existsLocationIndex = await this.addresses.indexExists('location_2dsphere')
    if (!existsLocationIndex) {
      this.addresses.createIndex({ location: '2dsphere' })
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
  get refreshToken(): Collection<RefreshToken> {
    return this.db.collection('refreshToken')
  }
  get bids(): Collection<Bid> {
    return this.db.collection('bids')
  }

  get inventories(): Collection<Inventory> {
    return this.db.collection('inventories')
  }

  get feedbacks(): Collection<Feedback> {
    return this.db.collection('feedbacks')
  }

  get messages(): Collection<Message> {
    return this.db.collection('messages')
  }

  get returnRequests(): Collection<ReturnRequest> {
    return this.db.collection('return_requests')
  }
  get paymentMethods(): Collection<PaymentMethod> {
    return this.db.collection('payment_methods')
  }

  get shippingMethods(): Collection<ShippingMethod> {
    return this.db.collection('shipping_methods')
  }

  get transactions(): Collection<Transaction> {
    return this.db.collection('transactions')
  }

  get shipments(): Collection<Shipment> {
    return this.db.collection('shipments')
  }

  // Thêm vào phương thức connect để tạo indexes
  async indexPaymentMethods() {
    const existsUserIndex = await this.paymentMethods.indexExists('user_id_1')
    if (!existsUserIndex) {
      this.paymentMethods.createIndex({ user_id: 1 })
    }
  }

  async indexTransactions() {
    const existsOrderIndex = await this.transactions.indexExists('order_id_1')
    if (!existsOrderIndex) {
      this.transactions.createIndex({ order_id: 1 })
    }

    const existsUserIndex = await this.transactions.indexExists('user_id_1')
    if (!existsUserIndex) {
      this.transactions.createIndex({ user_id: 1 })
    }

    const existsSellerIndex = await this.transactions.indexExists('seller_id_1')
    if (!existsSellerIndex) {
      this.transactions.createIndex({ seller_id: 1 })
    }
  }

  async indexShipments() {
    const existsOrderIndex = await this.shipments.indexExists('order_id_1')
    if (!existsOrderIndex) {
      this.shipments.createIndex({ order_id: 1 }, { unique: true })
    }

    const existsTrackingIndex = await this.shipments.indexExists('tracking_number_1')
    if (!existsTrackingIndex) {
      this.shipments.createIndex({ tracking_number: 1 }, { sparse: true })
    }
  }
  async indexBids() {
    const existsProductIndex = await this.bids.indexExists('product_id_1')
    if (!existsProductIndex) {
      this.bids.createIndex({ product_id: 1 })
    }

    const existsBidderIndex = await this.bids.indexExists('bidder_id_1')
    if (!existsBidderIndex) {
      this.bids.createIndex({ bidder_id: 1 })
    }
  }

  async indexInventories() {
    const existsProductIndex = await this.inventories.indexExists('product_id_1')
    if (!existsProductIndex) {
      this.inventories.createIndex({ product_id: 1 }, { unique: true })
    }
  }

  async indexMessages() {
    const existsSenderIndex = await this.messages.indexExists('sender_id_1_receiver_id_1')
    if (!existsSenderIndex) {
      this.messages.createIndex({ sender_id: 1, receiver_id: 1 })
    }

    const existsReceiverIndex = await this.messages.indexExists('receiver_id_1_read_1')
    if (!existsReceiverIndex) {
      this.messages.createIndex({ receiver_id: 1, read: 1 })
    }
  }

  async indexFeedbacks() {
    const existsSellerIndex = await this.feedbacks.indexExists('seller_id_1')
    if (!existsSellerIndex) {
      this.feedbacks.createIndex({ seller_id: 1 })
    }
  }

  async indexReturnRequests() {
    const existsOrderIndex = await this.returnRequests.indexExists('order_id_1')
    if (!existsOrderIndex) {
      this.returnRequests.createIndex({ order_id: 1 })
    }

    const existsUserIndex = await this.returnRequests.indexExists('user_id_1')
    if (!existsUserIndex) {
      this.returnRequests.createIndex({ user_id: 1 })
    }
  }
}

const databaseService = DatabaseService.getInstance()
databaseService.connect().catch(console.error)
export default databaseService
