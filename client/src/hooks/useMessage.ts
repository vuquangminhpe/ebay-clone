import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageApi, SendMessageRequest } from '@/apis/MessageApi'
import { toast } from 'sonner'

export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendMessageRequest) => MessageApi.sendMessage(data),
    onSuccess: (_, variables) => {
      toast.success('Message sent successfully')
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.receiver_id] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['recent-conversations'] })
    },
    onError: () => {
      toast.error('Failed to send message')
    }
  })
}

export const useConversation = (user_id: string, params: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['conversation', user_id, params],
    queryFn: () => MessageApi.getConversation(user_id, params),
    select: (data) => data.data,
    staleTime: 1 * 60 * 1000, // 1 minute as messages can come in real-time
    enabled: !!user_id,
    refetchInterval: 10000 // Poll every 10 seconds for new messages
  })
}

export const useUserConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => MessageApi.getUserConversations(),
    select: (data) => data.data,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30000 // Poll every 30 seconds for new conversations
  })
}

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message_id: string) => MessageApi.markMessageAsRead(message_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-message-count'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['recent-conversations'] })
    }
  })
}

export const useUnreadMessageCount = () => {
  return useQuery({
    queryKey: ['unread-message-count'],
    queryFn: () => MessageApi.getUnreadMessageCount(),
    select: (data) => data.data.count,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30000 // Poll every 30 seconds for new unread messages
  })
}

export const useRecentConversations = (limit?: number) => {
  return useQuery({
    queryKey: ['recent-conversations', limit],
    queryFn: () => MessageApi.getRecentConversations(limit),
    select: (data) => data.data,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30000 // Poll every 30 seconds for new messages
  })
}

export const useMarkAllMessagesAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (user_id: string) => MessageApi.markAllMessagesAsRead(user_id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables] })
      queryClient.invalidateQueries({ queryKey: ['unread-message-count'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['recent-conversations'] })
    },
    onError: () => {
      toast.error('Failed to mark messages as read')
    }
  })
}
