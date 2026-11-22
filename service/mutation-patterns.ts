// Standardized mutation patterns for API operations

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { del, post, put } from './base'
import { QUERY_KEYS, createMutationConfig } from './query-config'
import { useQueryInvalidation } from './query-invalidation'
import { handleApiError } from './error-handler'
import { useOptimisticUpdates } from './optimistic-updates'
import type { ConversationItem, IChatItem } from '@/types/chat'
import type { App } from '@/types/app'

/**
 * Standard mutation configuration with common patterns
 */
type BaseMutationConfig<TData = any, TVariables = any> = {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  onSettled?: () => void
  optimisticUpdate?: boolean
  invalidateQueries?: string[][]
  showToast?: boolean
}

/**
 * Create a standardized mutation with error handling and invalidation
 */
export const useStandardMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config: BaseMutationConfig<TData, TVariables> = {},
) => {
  const queryClient = useQueryClient()
  const { invalidateQueries } = useQueryInvalidation()

  return useMutation(
    createMutationConfig(
      mutationFn,
      {
        onSuccess: (data, variables) => {
          // Auto-invalidate specified queries
          if (config.invalidateQueries) {
            config.invalidateQueries.forEach((queryKey) => {
              queryClient.invalidateQueries({ queryKey })
            })
          }

          config.onSuccess?.(data, variables)
        },
        onError: (error: Error, variables) => {
          if (config.showToast !== false)
            handleApiError(error)

          config.onError?.(error, variables)
        },
        onSettled: config.onSettled,
      },
    ),
  )
}

/**
 * App-related mutations
 */
export const useAppMutations = () => {
  const { invalidateAfterAppCreation, invalidateAfterAppDeletion } = useQueryInvalidation()

  const createApp = useStandardMutation(
    (data: { name: string; description?: string; icon?: string }) =>
      post<App>('/apps', { body: data }),
    {
      onSuccess: () => invalidateAfterAppCreation(),
      invalidateQueries: [QUERY_KEYS.apps],
    },
  )

  const updateApp = useStandardMutation(
    (data: { id: string; updates: Partial<App> }) =>
      put<App>(`/apps/${data.id}`, { body: data.updates }),
    {
      onSuccess: (_, variables) => {
        // Invalidate specific app and app list
        invalidateAfterAppCreation()
      },
      invalidateQueries: [QUERY_KEYS.apps, QUERY_KEYS.appDetail(createApp.variables?.id || '')],
    },
  )

  const deleteApp = useStandardMutation(
    (appId: string) => del(`/apps/${appId}`),
    {
      onSuccess: (_, appId) => invalidateAfterAppDeletion(appId),
    },
  )

  return {
    createApp,
    updateApp,
    deleteApp,
  }
}

/**
 * Conversation-related mutations with enhanced optimistic updates
 */
export const useConversationMutations = () => {
  const { invalidateAfterConversationCreation, invalidateAfterConversationDeletion } = useQueryInvalidation()
  const queryClient = useQueryClient()
  const {
    optimisticallyCreateConversation,
    optimisticallyUpdateConversation,
    optimisticallyDeleteConversation,
    optimisticallyTogglePin,
    replaceTemporaryConversation,
  } = useOptimisticUpdates()

  const createConversation = useStandardMutation(
    (data: { appId: string; name?: string; inputs?: Record<string, any> }) =>
      post<ConversationItem>('/conversations', { body: data }),
    {
      onMutate: (variables) => {
        // Apply optimistic update before API call
        return optimisticallyCreateConversation(variables.appId, {
          name: variables.name,
        })
      },
      onSuccess: (newConversation, variables, context) => {
        invalidateAfterConversationCreation(variables.appId)

        // Replace temporary conversation with real one
        if (context)
          replaceTemporaryConversation(variables.appId, context.tempConversation.id, newConversation)
      },
      onError: (error, variables, context) => {
        // Rollback optimistic update on error
        if (context?.rollback)
          context.rollback()
      },
    },
  )

  const updateConversation = useStandardMutation(
    (data: { id: string; appId: string; updates: Partial<ConversationItem> }) =>
      put<ConversationItem>(`/conversations/${data.id}`, { body: data.updates }),
    {
      onMutate: (variables) => {
        // Apply optimistic update before API call
        return optimisticallyUpdateConversation(variables.id, variables.appId, variables.updates)
      },
      onSuccess: (updatedConversation, variables) => {
        // Update conversation caches with server response
        queryClient.setQueryData(
          QUERY_KEYS.conversationDetail(variables.id),
          updatedConversation,
        )

        const conversationListKey = QUERY_KEYS.conversations(variables.appId)
        const existingConversations = queryClient.getQueryData<ConversationItem[]>(conversationListKey) || []
        const updatedList = existingConversations.map(conv =>
          conv.id === variables.id ? updatedConversation : conv,
        )
        queryClient.setQueryData(conversationListKey, updatedList)
      },
      onError: (error, variables, context) => {
        // Rollback optimistic update on error
        if (context?.rollback)
          context.rollback()
      },
    },
  )

  const deleteConversation = useStandardMutation(
    (data: { id: string; appId: string }) => del(`/conversations/${data.id}`),
    {
      onMutate: (variables) => {
        // Apply optimistic delete before API call
        return optimisticallyDeleteConversation(variables.id, variables.appId)
      },
      onSuccess: (_, variables) => {
        invalidateAfterConversationDeletion(variables.id, variables.appId)
      },
      onError: (error, variables, context) => {
        // Rollback optimistic update on error
        if (context?.rollback)
          context.rollback()
      },
    },
  )

  const pinConversation = useStandardMutation(
    (data: { id: string; appId: string }) =>
      post(`/conversations/${data.id}/pin`, {}),
    {
      onMutate: (variables) => {
        // Apply optimistic pin before API call
        return optimisticallyTogglePin(variables.id, variables.appId, true)
      },
      onError: (error, variables, context) => {
        // Rollback optimistic update on error
        if (context?.rollback)
          context.rollback()
      },
    },
  )

  const unpinConversation = useStandardMutation(
    (data: { id: string; appId: string }) =>
      post(`/conversations/${data.id}/unpin`, {}),
    {
      onMutate: (variables) => {
        // Apply optimistic unpin before API call
        return optimisticallyTogglePin(variables.id, variables.appId, false)
      },
      onError: (error, variables, context) => {
        // Rollback optimistic update on error
        if (context?.rollback)
          context.rollback()
      },
    },
  )

  return {
    createConversation,
    updateConversation,
    deleteConversation,
    pinConversation,
    unpinConversation,
  }
}

/**
 * Message-related mutations with enhanced optimistic updates
 */
export const useMessageMutations = () => {
  const { invalidateAfterMessageSent, invalidateAfterFeedback } = useQueryInvalidation()
  const queryClient = useQueryClient()
  const {
    optimisticallyAddMessage,
    optimisticallyUpdateMessageFeedback,
    replaceTemporaryMessage,
  } = useOptimisticUpdates()

  const sendMessage = useStandardMutation(
    (data: {
      conversationId: string
      appId?: string
      message: string
      inputs?: Record<string, any>
      files?: any[]
    }) => {
      // This would typically be handled by SSE, but we provide the mutation structure
      return post<IChatItem>('/chat-messages', { body: data })
    },
    {
      onMutate: (variables) => {
        // Add user message optimistically
        return optimisticallyAddMessage(variables.conversationId, {
          content: variables.message,
          message_type: 'question',
          message_files: variables.files || [],
        })
      },
      onSuccess: (newMessage, variables, context) => {
        if (variables.conversationId)
          invalidateAfterMessageSent(variables.conversationId, variables.appId)

        // Replace temporary message with real one if needed
        if (context && newMessage)
          replaceTemporaryMessage(variables.conversationId, context.tempMessage.id, newMessage)
      },
      onError: (error, variables, context) => {
        // Rollback optimistic update on error
        if (context?.rollback)
          context.rollback()
      },
    },
  )

  const updateMessageFeedback = useStandardMutation(
    (data: {
      messageId: string
      conversationId: string
      feedback: { rating: 'like' | 'dislike' | null; content?: string }
    }) =>
      post(`/messages/${data.messageId}/feedbacks`, { body: data.feedback }),
    {
      onMutate: (variables) => {
        // Apply feedback optimistically
        return optimisticallyUpdateMessageFeedback(
          variables.conversationId,
          variables.messageId,
          variables.feedback,
        )
      },
      onSuccess: (_, variables) => {
        invalidateAfterFeedback(variables.conversationId)
      },
      onError: (error, variables, context) => {
        // Rollback optimistic update on error
        if (context?.rollback)
          context.rollback()
      },
    },
  )

  const regenerateMessage = useStandardMutation(
    (data: { messageId: string; conversationId: string }) =>
      post(`/messages/${data.messageId}/regenerate`, {}),
    {
      onMutate: (variables) => {
        // Add loading indicator for regeneration
        return optimisticallyAddMessage(variables.conversationId, {
          content: '',
          message_type: 'answer',
          isAnswering: true,
        })
      },
      onSuccess: (_, variables, context) => {
        invalidateAfterMessageSent(variables.conversationId)
      },
      onError: (error, variables, context) => {
        // Rollback optimistic update on error
        if (context?.rollback)
          context.rollback()
      },
    },
  )

  return {
    sendMessage,
    updateMessageFeedback,
    regenerateMessage,
  }
}

/**
 * Batch operations for multiple mutations with optimistic updates
 */
export const useBatchMutations = () => {
  const queryClient = useQueryClient()
  const { optimisticallyBatchDeleteConversations } = useOptimisticUpdates()

  const batchDeleteConversations = useStandardMutation(
    (data: { conversationIds: string[]; appId: string }) =>
      Promise.all(
        data.conversationIds.map(id => del(`/conversations/${id}`)),
      ),
    {
      onMutate: (variables) => {
        // Apply batch delete optimistically
        return optimisticallyBatchDeleteConversations(variables.conversationIds, variables.appId)
      },
      onSuccess: (_, variables) => {
        // Invalidate conversation list to ensure consistency
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations(variables.appId) })
      },
      onError: (error, variables, context) => {
        // Rollback optimistic update on error
        if (context?.rollback)
          context.rollback()
      },
    },
  )

  return {
    batchDeleteConversations,
  }
}

/**
 * Utility for handling file uploads with mutations
 */
export const useFileUploadMutation = () => {
  return useStandardMutation(
    (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return post<{ id: string; url: string }>('/file-upload', { body: formData })
    },
    {
      showToast: false, // Handle toast manually based on context
    },
  )
}

/**
 * Mutation for updating user preferences
 */
export const useUserMutations = () => {
  const { invalidateUser } = useQueryInvalidation()

  const updateProfile = useStandardMutation(
    (data: { name?: string; avatar?: string }) =>
      put('/account/profile', { body: data }),
    {
      onSuccess: () => invalidateUser(),
    },
  )

  return {
    updateProfile,
  }
}

export {
  useStandardMutation,
  useAppMutations,
  useConversationMutations,
  useMessageMutations,
  useBatchMutations,
  useFileUploadMutation,
  useUserMutations,
}
