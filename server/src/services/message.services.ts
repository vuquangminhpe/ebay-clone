// src/services/message.services.ts
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Message from '../models/schemas/Message.schema'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

class MessageService {
  async createMessage({
    sender_id,
    receiver_id,
    content,
    related_order_id,
    related_product_id
  }: {
    sender_id: string
    receiver_id: string
    content: string
    related_order_id?: string
    related_product_id?: string
  }) {
    // Create message
    const message = new Message({
      sender_id: new ObjectId(sender_id),
      receiver_id: new ObjectId(receiver_id),
      content,
      read: false,
      related_order_id: related_order_id ? new ObjectId(related_order_id) : undefined,
      related_product_id: related_product_id ? new ObjectId(related_product_id) : undefined
    })

    const result = await databaseService.messages.insertOne(message)

    return { ...message, _id: result.insertedId }
  }

  async getMessageById(message_id: string) {
    return databaseService.messages.findOne({ _id: new ObjectId(message_id) })
  }

  async markMessageAsRead(message_id: string) {
    await databaseService.messages.updateOne(
      { _id: new ObjectId(message_id) },
      {
        $set: {
          read: true,
          read_at: new Date(),
          updated_at: new Date()
        }
      }
    )

    return this.getMessageById(message_id)
  }

  async getConversation(
    user1_id: string,
    user2_id: string,
    {
      limit = 20,
      page = 1
    }: {
      limit?: number
      page?: number
    } = {}
  ) {
    const skip = (page - 1) * limit

    // Get messages between the two users, ordered by newest first
    const messages = await databaseService.messages
      .find({
        $or: [
          { sender_id: new ObjectId(user1_id), receiver_id: new ObjectId(user2_id) },
          { sender_id: new ObjectId(user2_id), receiver_id: new ObjectId(user1_id) }
        ]
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Count total messages
    const total = await databaseService.messages.countDocuments({
      $or: [
        { sender_id: new ObjectId(user1_id), receiver_id: new ObjectId(user2_id) },
        { sender_id: new ObjectId(user2_id), receiver_id: new ObjectId(user1_id) }
      ]
    })

    // Get user details
    const [user1, user2] = await Promise.all([
      databaseService.users.findOne(
        { _id: new ObjectId(user1_id) },
        { projection: { name: 1, username: 1, avatar: 1 } }
      ),
      databaseService.users.findOne(
        { _id: new ObjectId(user2_id) },
        { projection: { name: 1, username: 1, avatar: 1 } }
      )
    ])

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    // Mark unread messages as read if they are to the current user
    await databaseService.messages.updateMany(
      {
        sender_id: new ObjectId(user2_id),
        receiver_id: new ObjectId(user1_id),
        read: false
      },
      {
        $set: {
          read: true,
          read_at: new Date(),
          updated_at: new Date()
        }
      }
    )

    return {
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages
      },
      users: {
        user1: user1
          ? {
              _id: user1._id,
              name: user1.name,
              username: user1.username,
              avatar: user1.avatar
            }
          : null,
        user2: user2
          ? {
              _id: user2._id,
              name: user2.name,
              username: user2.username,
              avatar: user2.avatar
            }
          : null
      }
    }
  }

  async getUserConversations(user_id: string) {
    // Find all unique users this user has conversations with
    const sentMessages = await databaseService.messages
      .find({ sender_id: new ObjectId(user_id) })
      .project({ receiver_id: 1 })
      .toArray()

    const receivedMessages = await databaseService.messages
      .find({ receiver_id: new ObjectId(user_id) })
      .project({ sender_id: 1 })
      .toArray()

    // Combine unique user IDs
    const conversationUserIds = [
      ...new Set([
        ...sentMessages.map((msg) => msg.receiver_id.toString()),
        ...receivedMessages.map((msg) => msg.sender_id.toString())
      ])
    ]

    // For each conversation partner, get the most recent message and unread count
    const conversations = await Promise.all(
      conversationUserIds.map(async (otherUserId) => {
        // Get the most recent message
        const latestMessage = await databaseService.messages
          .find({
            $or: [
              { sender_id: new ObjectId(user_id), receiver_id: new ObjectId(otherUserId) },
              { sender_id: new ObjectId(otherUserId), receiver_id: new ObjectId(user_id) }
            ]
          })
          .sort({ created_at: -1 })
          .limit(1)
          .toArray()

        // Count unread messages
        const unreadCount = await databaseService.messages.countDocuments({
          sender_id: new ObjectId(otherUserId),
          receiver_id: new ObjectId(user_id),
          read: false
        })

        // Get user details
        const otherUser = await databaseService.users.findOne(
          { _id: new ObjectId(otherUserId as string) },
          { projection: { name: 1, username: 1, avatar: 1 } }
        )

        return {
          user: otherUser
            ? {
                _id: otherUser._id,
                name: otherUser.name,
                username: otherUser.username,
                avatar: otherUser.avatar
              }
            : null,
          last_message: latestMessage[0],
          unread_count: unreadCount,
          updated_at: latestMessage[0]?.created_at || new Date()
        }
      })
    )

    // Sort by most recent message
    return conversations.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
  }

  async getUnreadMessageCount(user_id: string) {
    return databaseService.messages.countDocuments({
      receiver_id: new ObjectId(user_id),
      read: false
    })
  }
  async getRecentConversations(user_id: string, limit: number = 15) {
    // Tìm các cuộc hội thoại gần đây nhất
    const recentSentMessages = await databaseService.messages
      .find({ sender_id: new ObjectId(user_id) })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    const recentReceivedMessages = await databaseService.messages
      .find({ receiver_id: new ObjectId(user_id) })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    // Kết hợp và lọc các cuộc hội thoại duy nhất
    const conversationMap = new Map()

    // Xử lý tin nhắn đã gửi
    recentSentMessages.forEach((msg) => {
      const otherUser = msg.receiver_id.toString()
      if (!conversationMap.has(otherUser) || conversationMap.get(otherUser).created_at < msg.created_at) {
        conversationMap.set(otherUser, msg)
      }
    })

    // Xử lý tin nhắn đã nhận
    recentReceivedMessages.forEach((msg) => {
      const otherUser = msg.sender_id.toString()
      if (!conversationMap.has(otherUser) || conversationMap.get(otherUser).created_at < msg.created_at) {
        conversationMap.set(otherUser, msg)
      }
    })

    // Lấy thông tin người dùng cho mỗi cuộc hội thoại
    const conversations = []
    for (const [otherUserId, message] of conversationMap.entries()) {
      const otherUser = await databaseService.users.findOne(
        { _id: new ObjectId(otherUserId) },
        { projection: { name: 1, username: 1, avatar: 1 } }
      )

      const unreadCount = await databaseService.messages.countDocuments({
        sender_id: new ObjectId(otherUserId),
        receiver_id: new ObjectId(user_id),
        read: false
      })

      conversations.push({
        user: otherUser
          ? {
              _id: otherUser._id,
              name: otherUser.name,
              username: otherUser.username,
              avatar: otherUser.avatar
            }
          : null,
        last_message: {
          _id: message._id,
          content: message.content,
          created_at: message.created_at,
          is_from_me: message.sender_id.toString() === user_id
        },
        unread_count: unreadCount
      })
    }

    // Sắp xếp theo thời gian tin nhắn gần đây nhất
    return conversations.sort((a, b) => b.last_message.created_at.getTime() - a.last_message.created_at.getTime())
  }

  // Thêm phương thức hỗ trợ Socket
  async getConversationRealtime(sender_id: string, receiver_id: string, limit: number = 20) {
    // Lấy tin nhắn giữa hai người dùng, mới nhất trước
    const messages = await databaseService.messages
      .find({
        $or: [
          { sender_id: new ObjectId(sender_id), receiver_id: new ObjectId(receiver_id) },
          { sender_id: new ObjectId(receiver_id), receiver_id: new ObjectId(sender_id) }
        ]
      })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    // Đảo ngược mảng để hiển thị theo thứ tự cũ nhất -> mới nhất
    return messages.reverse()
  }

  // Thêm phương thức đánh dấu tất cả tin nhắn từ người gửi đã đọc
  async markAllMessagesFromSenderAsRead(sender_id: string, receiver_id: string) {
    await databaseService.messages.updateMany(
      {
        sender_id: new ObjectId(sender_id),
        receiver_id: new ObjectId(receiver_id),
        read: false
      },
      {
        $set: {
          read: true,
          read_at: new Date(),
          updated_at: new Date()
        }
      }
    )

    return {
      success: true,
      sender_id,
      receiver_id
    }
  }
}

const messageService = new MessageService()
export default messageService
