import { SuccessResponse } from '@/types/utils.type'
import http from '@/utils/http'

// Request types
export interface SendMessageRequest {
  receiver_id: string
  content: string
  related_order_id?: string
  related_product_id?: string
}

// Response types
export interface Message {
  _id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  read_at?: string
  related_order_id?: string
  related_product_id?: string
  created_at: string
  updated_at: string
}

export interface ConversationUser {
  _id: string
  name: string
  username: string
  avatar: string
}

export interface ConversationResponse {
  messages: Message[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  users: {
    user1: ConversationUser | null
    user2: ConversationUser | null
  }
}

export interface ConversationPreview {
  user: ConversationUser | null
  last_message: {
    _id: string
    content: string
    created_at: string
    is_from_me: boolean
  }
  unread_count: number
}

// API implementation
export const MessageApi = {
  // Send a message to another user - requires authentication
  sendMessage: (data: SendMessageRequest) => http.post<SuccessResponse<Message>>('/messages', data),

  // Get conversation with another user - requires authentication
  getConversation: (user_id: string, params: { page?: number; limit?: number }) =>
    http.get<SuccessResponse<ConversationResponse>>(`/messages/conversation/${user_id}`, { params }),

  // Get all user conversations - requires authentication
  getUserConversations: () => http.get<SuccessResponse<ConversationPreview[]>>('/messages/conversations'),

  // Mark a message as read - requires authentication (only for recipient)
  markMessageAsRead: (message_id: string) => http.put<SuccessResponse<Message>>(`/messages/${message_id}/read`, {}),

  // Get count of unread messages - requires authentication
  getUnreadMessageCount: () => http.get<SuccessResponse<{ count: number }>>('/messages/unread/count'),

  // Get recent conversations - requires authentication
  getRecentConversations: (limit?: number) =>
    http.get<SuccessResponse<ConversationPreview[]>>('/messages/conversations/recent', {
      params: { limit }
    }),

  // Mark all messages from a specific sender as read - requires authentication
  markAllMessagesAsRead: (user_id: string) =>
    http.put<SuccessResponse<{ success: boolean }>>(`/messages/conversation/${user_id}/read-all`, {})
}
