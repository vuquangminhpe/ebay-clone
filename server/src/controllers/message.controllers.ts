// src/controllers/message.controllers.ts
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import messageService from '../services/message.services'

// Define request body interfaces
interface SendMessageReqBody {
  receiver_id: string
  content: string
  related_order_id?: string
  related_product_id?: string
}

interface MarkReadReqBody {
  message_id: string
}

// Define request params interface
interface ConversationParams extends ParamsDictionary {
  user_id: string
}

interface MessageParams extends ParamsDictionary {
  message_id: string
}

export const sendMessageController = async (req: Request<ParamsDictionary, any, SendMessageReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { receiver_id, content, related_order_id, related_product_id } = req.body

  try {
    // Send message
    const result = await messageService.createMessage({
      sender_id: user_id,
      receiver_id,
      content,
      related_order_id,
      related_product_id
    })

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Message sent successfully',
      result
    })
  } catch (error) {
    console.error('Send message error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to send message'
    })
  }
}

export const getConversationController = async (req: Request<ConversationParams>, res: Response) => {
  const { user_id: current_user_id } = req.decode_authorization as TokenPayload
  const { user_id: other_user_id } = req.params
  const { page = '1', limit = '20' } = req.query

  try {
    // Get conversation
    const result = await messageService.getConversation(current_user_id, other_user_id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Conversation retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get conversation'
    })
  }
}

export const getUserConversationsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  try {
    // Get all user conversations
    const result = await messageService.getUserConversations(user_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'User conversations retrieved successfully',
      result
    })
  } catch (error) {
    console.error('Get user conversations error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get user conversations'
    })
  }
}

export const markMessageAsReadController = async (req: Request<MessageParams, any, MarkReadReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { message_id } = req.params

  try {
    // Get message
    const message = await messageService.getMessageById(message_id)

    if (!message) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Message not found'
      })
    }

    // Ensure user is the recipient
    if (message.receiver_id.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'You can only mark messages sent to you as read'
      })
    }

    // Mark message as read
    const result = await messageService.markMessageAsRead(message_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Message marked as read',
      result
    })
  } catch (error) {
    console.error('Mark message as read error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to mark message as read'
    })
  }
}

export const getUnreadMessageCountController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  try {
    // Get unread message count
    const count = await messageService.getUnreadMessageCount(user_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'Unread message count retrieved successfully',
      result: { count }
    })
  } catch (error) {
    console.error('Get unread message count error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get unread message count'
    })
  }
}
export const getRecentConversationsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { limit = '15' } = req.query

  try {
    // Get recent conversations
    const conversations = await messageService.getRecentConversations(user_id, parseInt(limit as string))

    return res.status(HTTP_STATUS.OK).json({
      message: 'Recent conversations retrieved successfully',
      result: conversations
    })
  } catch (error) {
    console.error('Get recent conversations error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to get recent conversations'
    })
  }
}

export const markAllMessagesAsReadController = async (req: Request<ConversationParams>, res: Response) => {
  const { user_id: current_user_id } = req.decode_authorization as TokenPayload
  const { user_id: sender_id } = req.params

  try {
    // Mark all messages from sender as read
    await messageService.markAllMessagesFromSenderAsRead(sender_id, current_user_id)

    return res.status(HTTP_STATUS.OK).json({
      message: 'All messages marked as read',
      result: { success: true }
    })
  } catch (error) {
    console.error('Mark all messages as read error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to mark messages as read'
    })
  }
}
