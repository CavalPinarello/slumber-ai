// Enhanced optimistic updates for conversation operations

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { QUERY_KEYS } from './query-config'
import type { ConversationItem, IChatItem } from '@/types/chat'

export type OptimisticUpdateContext = {
  queryClient: ReturnType<typeof useQueryClient>
  rollback: () => void
}

/**
 * Hook for managing optimistic updates with rollback capability
 */
export const useOptimisticUpdates = () => {
  const queryClient = useQueryClient()

  /**
   * Create a new conversation optimistically
   */
  const optimisticallyCreateConversation = useCallback(
    (appId: string, conversationData: Partial<ConversationItem>) => {
      const conversationListKey = QUERY_KEYS.conversations(appId)
      const existingConversations = queryClient.getQueryData<ConversationItem[]>(conversationListKey) || []

      // Create temporary conversation with optimistic ID
      const tempConversation: ConversationItem = {
        id: `temp-${Date.now()}`,
        name: conversationData.name || 'New Conversation',
        status: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
        user_feedback_stats: { like: 0, dislike: 0 },
        admin_feedback_stats: { like: 0, dislike: 0 },
        is_pinned: false,
        ...conversationData,
      }

      // Add to beginning of list
      const updatedConversations = [tempConversation, ...existingConversations]
      queryClient.setQueryData(conversationListKey, updatedConversations)

      // Return rollback function
      const rollback = () => {
        queryClient.setQueryData(conversationListKey, existingConversations)
      }

      return { tempConversation, rollback }
    },
    [queryClient],
  )

  /**
   * Update conversation optimistically
   */
  const optimisticallyUpdateConversation = useCallback(
    (conversationId: string, appId: string, updates: Partial<ConversationItem>) => {
      const conversationListKey = QUERY_KEYS.conversations(appId)
      const conversationDetailKey = QUERY_KEYS.conversationDetail(conversationId)

      // Store original data for rollback
      const originalList = queryClient.getQueryData<ConversationItem[]>(conversationListKey)
      const originalDetail = queryClient.getQueryData<ConversationItem>(conversationDetailKey)

      // Update conversation in list
      if (originalList) {
        const updatedList = originalList.map(conv =>
          conv.id === conversationId
            ? { ...conv, ...updates, updated_at: new Date().toISOString() }
            : conv,
        )
        queryClient.setQueryData(conversationListKey, updatedList)
      }

      // Update conversation detail
      if (originalDetail) {
        const updatedDetail = { ...originalDetail, ...updates, updated_at: new Date().toISOString() }
        queryClient.setQueryData(conversationDetailKey, updatedDetail)
      }

      // Return rollback function
      const rollback = () => {
        if (originalList)
          queryClient.setQueryData(conversationListKey, originalList)

        if (originalDetail)
          queryClient.setQueryData(conversationDetailKey, originalDetail)
      }

      return { rollback }
    },
    [queryClient],
  )

  /**
   * Delete conversation optimistically
   */
  const optimisticallyDeleteConversation = useCallback(
    (conversationId: string, appId: string) => {
      const conversationListKey = QUERY_KEYS.conversations(appId)
      const originalList = queryClient.getQueryData<ConversationItem[]>(conversationListKey)

      if (originalList) {
        const updatedList = originalList.filter(conv => conv.id !== conversationId)
        queryClient.setQueryData(conversationListKey, updatedList)
      }

      // Remove conversation detail and messages from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.conversationDetail(conversationId) })
      queryClient.removeQueries({ queryKey: QUERY_KEYS.messages(conversationId) })

      // Return rollback function
      const rollback = () => {
        if (originalList)
          queryClient.setQueryData(conversationListKey, originalList)

        // Note: Cannot rollback removed queries, would need to refetch
      }

      return { rollback }
    },
    [queryClient],
  )

  /**
   * Pin/unpin conversation optimistically
   */
  const optimisticallyTogglePin = useCallback(
    (conversationId: string, appId: string, isPinned: boolean) => {
      const conversationListKey = QUERY_KEYS.conversations(appId)
      const conversationDetailKey = QUERY_KEYS.conversationDetail(conversationId)

      // Store original data
      const originalList = queryClient.getQueryData<ConversationItem[]>(conversationListKey)
      const originalDetail = queryClient.getQueryData<ConversationItem>(conversationDetailKey)

      // Update pin status in list
      if (originalList) {
        const updatedList = originalList.map(conv =>
          conv.id === conversationId
            ? { ...conv, is_pinned: isPinned, updated_at: new Date().toISOString() }
            : conv,
        )

        // Sort list to move pinned conversations to top
        const sortedList = updatedList.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned)
            return -1
          if (!a.is_pinned && b.is_pinned)
            return 1
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        })

        queryClient.setQueryData(conversationListKey, sortedList)
      }

      // Update detail
      if (originalDetail) {
        queryClient.setQueryData(conversationDetailKey, {
          ...originalDetail,
          is_pinned: isPinned,
          updated_at: new Date().toISOString(),
        })
      }

      // Return rollback function
      const rollback = () => {
        if (originalList)
          queryClient.setQueryData(conversationListKey, originalList)

        if (originalDetail)
          queryClient.setQueryData(conversationDetailKey, originalDetail)
      }

      return { rollback }
    },
    [queryClient],
  )

  /**
   * Add message optimistically (for UI feedback before SSE confirms)
   */
  const optimisticallyAddMessage = useCallback(
    (conversationId: string, message: Partial<IChatItem>) => {
      const messagesKey = QUERY_KEYS.messages(conversationId)
      const originalMessages = queryClient.getQueryData<IChatItem[]>(messagesKey) || []

      // Create temporary message
      const tempMessage: IChatItem = {
        id: `temp-${Date.now()}`,
        message_id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        content: message.content || '',
        message_type: message.message_type || 'answer',
        created_at: new Date().toISOString(),
        isAnswering: message.message_type === 'answer',
        agent_thoughts: [],
        message_files: [],
        workflow_run_id: null,
        ...message,
      }

      const updatedMessages = [...originalMessages, tempMessage]
      queryClient.setQueryData(messagesKey, updatedMessages)

      // Return rollback function
      const rollback = () => {
        queryClient.setQueryData(messagesKey, originalMessages)
      }

      return { tempMessage, rollback }
    },
    [queryClient],
  )

  /**
   * Update message feedback optimistically
   */
  const optimisticallyUpdateMessageFeedback = useCallback(
    (conversationId: string, messageId: string, feedback: { rating: 'like' | 'dislike' | null; content?: string }) => {
      const messagesKey = QUERY_KEYS.messages(conversationId)
      const originalMessages = queryClient.getQueryData<IChatItem[]>(messagesKey)

      if (originalMessages) {
        const updatedMessages = originalMessages.map(msg =>
          msg.message_id === messageId
            ? { ...msg, feedback }
            : msg,
        )
        queryClient.setQueryData(messagesKey, updatedMessages)
      }

      // Return rollback function
      const rollback = () => {
        if (originalMessages)
          queryClient.setQueryData(messagesKey, originalMessages)
      }

      return { rollback }
    },
    [queryClient],
  )

  /**
   * Batch delete conversations optimistically
   */
  const optimisticallyBatchDeleteConversations = useCallback(
    (conversationIds: string[], appId: string) => {
      const conversationListKey = QUERY_KEYS.conversations(appId)
      const originalList = queryClient.getQueryData<ConversationItem[]>(conversationListKey)

      if (originalList) {
        const updatedList = originalList.filter(conv => !conversationIds.includes(conv.id))
        queryClient.setQueryData(conversationListKey, updatedList)
      }

      // Remove all conversation details and messages
      conversationIds.forEach((id) => {
        queryClient.removeQueries({ queryKey: QUERY_KEYS.conversationDetail(id) })
        queryClient.removeQueries({ queryKey: QUERY_KEYS.messages(id) })
      })

      // Return rollback function
      const rollback = () => {
        if (originalList)
          queryClient.setQueryData(conversationListKey, originalList)
      }

      return { rollback }
    },
    [queryClient],
  )

  /**
   * Replace temporary conversation with real one after successful creation
   */
  const replaceTemporaryConversation = useCallback(
    (appId: string, tempId: string, realConversation: ConversationItem) => {
      const conversationListKey = QUERY_KEYS.conversations(appId)
      const existingConversations = queryClient.getQueryData<ConversationItem[]>(conversationListKey)

      if (existingConversations) {
        const updatedConversations = existingConversations.map(conv =>
          conv.id === tempId ? realConversation : conv,
        )
        queryClient.setQueryData(conversationListKey, updatedConversations)
      }

      // Set conversation detail
      queryClient.setQueryData(QUERY_KEYS.conversationDetail(realConversation.id), realConversation)
    },
    [queryClient],
  )

  /**
   * Replace temporary message with real one after SSE confirmation
   */
  const replaceTemporaryMessage = useCallback(
    (conversationId: string, tempId: string, realMessage: IChatItem) => {
      const messagesKey = QUERY_KEYS.messages(conversationId)
      const existingMessages = queryClient.getQueryData<IChatItem[]>(messagesKey)

      if (existingMessages) {
        const updatedMessages = existingMessages.map(msg =>
          msg.id === tempId ? realMessage : msg,
        )
        queryClient.setQueryData(messagesKey, updatedMessages)
      }
    },
    [queryClient],
  )

  return {
    optimisticallyCreateConversation,
    optimisticallyUpdateConversation,
    optimisticallyDeleteConversation,
    optimisticallyTogglePin,
    optimisticallyAddMessage,
    optimisticallyUpdateMessageFeedback,
    optimisticallyBatchDeleteConversations,
    replaceTemporaryConversation,
    replaceTemporaryMessage,
  }
}

/**
 * Enhanced conversation mutations with comprehensive optimistic updates
 */
export const useOptimisticConversationMutations = () => {
  const {
    optimisticallyCreateConversation,
    optimisticallyUpdateConversation,
    optimisticallyDeleteConversation,
    optimisticallyTogglePin,
    replaceTemporaryConversation,
  } = useOptimisticUpdates()

  const {
    createConversation: baseCreateConversation,
    updateConversation: baseUpdateConversation,
    deleteConversation: baseDeleteConversation,
    pinConversation: basePinConversation,
    unpinConversation: baseUnpinConversation,
  } = require('./mutation-patterns').useConversationMutations()

  /**
   * Create conversation with full optimistic update
   */
  const createConversationOptimistic = useCallback(
    (data: { appId: string; name?: string; inputs?: Record<string, any> }) => {
      // Apply optimistic update immediately
      const { tempConversation, rollback } = optimisticallyCreateConversation(data.appId, {
        name: data.name,
      })

      // Execute actual mutation
      return baseCreateConversation.mutateAsync(data, {
        onSuccess: (realConversation) => {
          // Replace temporary with real conversation
          replaceTemporaryConversation(data.appId, tempConversation.id, realConversation)
        },
        onError: () => {
          // Rollback on error
          rollback()
        },
      })
    },
    [optimisticallyCreateConversation, replaceTemporaryConversation, baseCreateConversation],
  )

  /**
   * Update conversation with optimistic update
   */
  const updateConversationOptimistic = useCallback(
    (data: { id: string; appId: string; updates: Partial<ConversationItem> }) => {
      const { rollback } = optimisticallyUpdateConversation(data.id, data.appId, data.updates)

      return baseUpdateConversation.mutateAsync(data, {
        onError: () => rollback(),
      })
    },
    [optimisticallyUpdateConversation, baseUpdateConversation],
  )

  /**
   * Delete conversation with optimistic update
   */
  const deleteConversationOptimistic = useCallback(
    (data: { id: string; appId: string }) => {
      const { rollback } = optimisticallyDeleteConversation(data.id, data.appId)

      return baseDeleteConversation.mutateAsync(data, {
        onError: () => rollback(),
      })
    },
    [optimisticallyDeleteConversation, baseDeleteConversation],
  )

  /**
   * Toggle pin with optimistic update
   */
  const togglePinOptimistic = useCallback(
    (data: { id: string; appId: string; isPinned: boolean }) => {
      const { rollback } = optimisticallyTogglePin(data.id, data.appId, data.isPinned)

      const mutation = data.isPinned ? basePinConversation : baseUnpinConversation

      return mutation.mutateAsync({ id: data.id, appId: data.appId }, {
        onError: () => rollback(),
      })
    },
    [optimisticallyTogglePin, basePinConversation, baseUnpinConversation],
  )

  return {
    createConversationOptimistic,
    updateConversationOptimistic,
    deleteConversationOptimistic,
    togglePinOptimistic,
  }
}

export default useOptimisticUpdates
