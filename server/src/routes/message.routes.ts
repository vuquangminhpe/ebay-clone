import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  getConversationController,
  getUserConversationsController,
  markMessageAsReadController,
  sendMessageController,
  getUnreadMessageCountController,
  getRecentConversationsController,
  markAllMessagesAsReadController
} from '../controllers/message.controllers'

const messageRouter = Router()

// Authentication required for messaging
messageRouter.use(AccessTokenValidator, verifiedUserValidator)

/**
 * @description Send a message to a user
 * @route POST /messages
 * @access Private
 */
messageRouter.post('/', wrapAsync(sendMessageController))

/**
 * @description Get conversation with another user
 * @route GET /messages/conversation/:user_id
 * @access Private
 */
messageRouter.get('/conversation/:user_id', wrapAsync(getConversationController))

/**
 * @description Get all user conversations
 * @route GET /messages/conversations
 * @access Private
 */
messageRouter.get('/conversations', wrapAsync(getUserConversationsController))

/**
 * @description Mark a message as read
 * @route PUT /messages/:message_id/read
 * @access Private
 */
messageRouter.put('/:message_id/read', wrapAsync(markMessageAsReadController))

/**
 * @description Get count of unread messages
 * @route GET /messages/unread/count
 * @access Private
 */
messageRouter.get('/unread/count', wrapAsync(getUnreadMessageCountController))
/**
 * @description Get recent conversations
 * @route GET /messages/conversations/recent
 * @access Private
 */
messageRouter.get('/conversations/recent', wrapAsync(getRecentConversationsController))

/**
 * @description Mark all messages from a sender as read
 * @route PUT /messages/conversation/:user_id/read-all
 * @access Private
 */
messageRouter.put('/conversation/:user_id/read-all', wrapAsync(markAllMessagesAsReadController))
export default messageRouter
