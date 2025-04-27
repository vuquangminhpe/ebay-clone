import express from 'express'
import usersRouter from './routes/user.routes'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import { initFolderImage, initFolderVideo, initFolderVideoHls } from './utils/file'
import cors, { CorsOptions } from 'cors'
// import '../utils/fake'
import jwt from 'jsonwebtoken'

import './utils/s3'
import { createServer } from 'http'
import helmet from 'helmet'
import { envConfig, isProduction } from './constants/config'
import { Server as SocketServer } from 'socket.io'
import bidRouter from './routes/bid.routes'
import inventoryRouter from './routes/inventory.routes'
import messageRouter from './routes/message.routes'
import returnRequestRouter from './routes/returnRequest.routes'
import feedbackRouter from './routes/feedback.routes'
import productsRouter from './routes/products.routes'
import cartRouter from './routes/cart.routes'
import orderRouter from './routes/order.routes'
import addressRouter from './routes/address.routes'
import databaseService from './services/database.services'
import couponRouter from './routes/coupon.routes'
import reviewRouter from './routes/review.routes'
import categoryRouter from './routes/category.routes'
import { TokenPayload } from './models/request/User.request'
import messageService from './services/message.services'
import paymentRouter from './routes/payment.routes'
import shippingRouter from './routes/shipping.routes'
config()
databaseService
  .connect()
  .then(() => {
    // Original indexes
    databaseService.indexUsers()
    databaseService.indexPaymentMethods()
    databaseService.indexTransactions()
    databaseService.indexShipments()

    // New indexes for eBay clone
    databaseService.indexProducts()
    databaseService.indexOrders()
    databaseService.indexAddresses()
    databaseService.indexReviews()
    databaseService.indexCoupons()
  })
  .catch()
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15p
//   max: 100, // 1 IP => 100 requests 15 phút
//   standardHeaders: true,
//   legacyHeaders: false
// })
// // => trả về lỗi 429 mặc định => giới hạn requests
const app = express()
const httpServer = createServer(app)
const port = envConfig.port || 3002
app.use(helmet())
const corsOptions: CorsOptions = {
  origin: isProduction ? envConfig.client_url : '*',
  optionsSuccessStatus: 200
}

// app.use(limiter)
app.use(cors(corsOptions))

try {
  initFolderImage()
  initFolderVideo()
  initFolderVideoHls()
  console.log('Directories initialized successfully')
} catch (error) {
  console.error('Error initializing directories:', error)
}
app.use(express.json())

// Original routes
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)

app.use('/bids', bidRouter)
app.use('/inventory', inventoryRouter)
app.use('/messages', messageRouter)
app.use('/returns', returnRequestRouter)
app.use('/feedback', feedbackRouter)
app.use('/products', productsRouter)
app.use('/cart', cartRouter)
app.use('/orders', orderRouter)
app.use('/addresses', addressRouter)
app.use('/categories', categoryRouter)
app.use('/reviews', reviewRouter)
app.use('/coupons', couponRouter)
app.use('/payments', paymentRouter)
app.use('/shipping', shippingRouter)
// app.use('/static/video-hls', express.static(UPLOAD_VIDEO_HLS_DIR))

app.use(defaultErrorHandler)
const io = new SocketServer(httpServer, {
  cors: {
    origin: isProduction ? envConfig.client_url : '*',
    methods: ['GET', 'POST']
  }
})
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) {
    return next(new Error('Authentication error'))
  }

  try {
    const decoded = jwt.verify(token, envConfig.privateKey_access_token as string) as TokenPayload
    socket.data.user = decoded
    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
})

io.on('connection', (socket) => {
  const userId = socket.data.user.user_id
  console.log(`User connected: ${userId}`)

  socket.join(userId)

  socket.on('send_message', async (data) => {
    try {
      const { receiver_id, content, related_order_id, related_product_id } = data

      const message = await messageService.createMessage({
        sender_id: userId,
        receiver_id,
        content,
        related_order_id,
        related_product_id
      })

      // Gửi tin nhắn đến người nhận
      io.to(receiver_id).emit('receive_message', message)

      // Phản hồi cho người gửi
      socket.emit('message_sent', message)
    } catch (error) {
      socket.emit('message_error', { error: 'Failed to send message' })
    }
  })

  // Lắng nghe sự kiện đánh dấu tin nhắn đã đọc
  socket.on('mark_as_read', async (data) => {
    try {
      const { message_id } = data
      const message = await messageService.getMessageById(message_id)

      if (message && message.receiver_id.toString() === userId) {
        await messageService.markMessageAsRead(message_id)
        socket.emit('message_marked_read', { message_id })

        // Thông báo cho người gửi biết tin nhắn đã được đọc
        io.to(message.sender_id.toString()).emit('message_read_by_receiver', { message_id })
      }
    } catch (error) {
      socket.emit('message_error', { error: 'Failed to mark message as read' })
    }
  })

  // Lắng nghe sự kiện người dùng đang nhập tin nhắn
  socket.on('typing', (data) => {
    const { receiver_id } = data
    io.to(receiver_id).emit('user_typing', { user_id: userId })
  })

  // Lắng nghe sự kiện người dùng ngừng nhập tin nhắn
  socket.on('stop_typing', (data) => {
    const { receiver_id } = data
    io.to(receiver_id).emit('user_stop_typing', { user_id: userId })
  })

  // Lắng nghe sự kiện ngắt kết nối
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`)
  })
})
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

export default app
