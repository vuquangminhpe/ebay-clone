import express from 'express'
import usersRouter from './routes/user.routes'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import { initFolderImage, initFolderVideo, initFolderVideoHls } from './utils/file'
import { UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_HLS_DIR } from './constants/dir'
import cors, { CorsOptions } from 'cors'
// import '../utils/fake'
import './utils/s3'
import { createServer } from 'http'
import helmet from 'helmet'
import { envConfig, isProduction } from './constants/config'

// Import new eBay clone routes
import productsRouter from './routes/products.routes'
import cartRouter from './routes/cart.routes'
import orderRouter from './routes/order.routes'
import addressRouter from './routes/address.routes'
import categoryRouter from './routes/category.routes'
import reviewRouter from './routes/review.routes'
import couponRouter from './routes/coupon.routes'
import storeRouter from './routes/store.routes'
import disputeRouter from './routes/dispute.routes'
import databaseService from './services/database.services'

config()
databaseService
  .connect()
  .then(() => {
    // Original indexes
    databaseService.indexUsers()

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

// New eBay clone routes
app.use('/products', productsRouter)
app.use('/cart', cartRouter)
app.use('/orders', orderRouter)
app.use('/addresses', addressRouter)
app.use('/categories', categoryRouter)
app.use('/reviews', reviewRouter)
app.use('/coupons', couponRouter)
app.use('/stores', storeRouter)
app.use('/disputes', disputeRouter)

// app.use('/static/video-hls', express.static(UPLOAD_VIDEO_HLS_DIR))

app.use(defaultErrorHandler)

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

export default app
