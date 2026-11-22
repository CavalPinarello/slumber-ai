// Comprehensive query invalidation patterns and utilities

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { INVALIDATION_PATTERNS, QUERY_KEYS } from './query-config'

/**
 * Hook for managing query invalidations with predefined patterns
 */
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient()

  // Individual invalidation functions
  const invalidateApps = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: INVALIDATION_PATTERNS.apps })
  }, [queryClient])

  const invalidateConversations = useCallback((appId?: string) => {
    if (appId)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations(appId) })
    else
      queryClient.invalidateQueries({ queryKey: INVALIDATION_PATTERNS.conversations })
  }, [queryClient])

  const invalidateMessages = useCallback((conversationId?: string) => {
    if (conversationId)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(conversationId) })
    else
      queryClient.invalidateQueries({ queryKey: INVALIDATION_PATTERNS.messages })
  }, [queryClient])

  const invalidateUser = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: INVALIDATION_PATTERNS.user })
  }, [queryClient])

  const invalidateAppDetail = useCallback((appId: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appDetail(appId) })
  }, [queryClient])

  const invalidateConversationDetail = useCallback((conversationId: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversationDetail(conversationId) })
  }, [queryClient])

  // Batch invalidation functions
  const invalidateAppRelated = useCallback((appId: string) => {
    // Invalidate app detail and all related conversations
    invalidateAppDetail(appId)
    invalidateConversations(appId)
  }, [invalidateAppDetail, invalidateConversations])

  const invalidateConversationRelated = useCallback((conversationId: string, appId?: string) => {
    // Invalidate conversation detail and all related messages
    invalidateConversationDetail(conversationId)
    invalidateMessages(conversationId)
    if (appId)
      invalidateConversations(appId)
  }, [invalidateConversationDetail, invalidateMessages, invalidateConversations])

  // Complete refresh functions
  const refreshAllData = useCallback(() => {
    queryClient.invalidateQueries()
  }, [queryClient])

  const refreshUserData = useCallback(() => {
    invalidateUser()
    invalidateApps()
  }, [invalidateUser, invalidateApps])

  // Specific workflow invalidations
  const invalidateAfterAppCreation = useCallback(() => {
    invalidateApps()
  }, [invalidateApps])

  const invalidateAfterAppDeletion = useCallback((appId: string) => {
    // Remove app-specific queries and invalidate app list
    queryClient.removeQueries({ queryKey: QUERY_KEYS.appDetail(appId) })
    queryClient.removeQueries({ queryKey: QUERY_KEYS.conversations(appId) })
    invalidateApps()
  }, [queryClient, invalidateApps])

  const invalidateAfterConversationCreation = useCallback((appId: string) => {
    invalidateConversations(appId)
  }, [invalidateConversations])

  const invalidateAfterConversationDeletion = useCallback((conversationId: string, appId: string) => {
    // Remove conversation-specific queries and invalidate conversation list
    queryClient.removeQueries({ queryKey: QUERY_KEYS.conversationDetail(conversationId) })
    queryClient.removeQueries({ queryKey: QUERY_KEYS.messages(conversationId) })
    invalidateConversations(appId)
  }, [queryClient, invalidateConversations])

  const invalidateAfterMessageSent = useCallback((conversationId: string, appId?: string) => {
    invalidateMessages(conversationId)
    if (appId) {
      // Update conversation list to show latest message time
      invalidateConversations(appId)
    }
  }, [invalidateMessages, invalidateConversations])

  const invalidateAfterFeedback = useCallback((conversationId: string) => {
    // Feedback updates don't need full message refresh, just the specific message
    invalidateMessages(conversationId)
  }, [invalidateMessages])

  return {
    // Individual invalidations
    invalidateApps,
    invalidateConversations,
    invalidateMessages,
    invalidateUser,
    invalidateAppDetail,
    invalidateConversationDetail,

    // Batch invalidations
    invalidateAppRelated,
    invalidateConversationRelated,

    // Complete refresh
    refreshAllData,
    refreshUserData,

    // Workflow-specific invalidations
    invalidateAfterAppCreation,
    invalidateAfterAppDeletion,
    invalidateAfterConversationCreation,
    invalidateAfterConversationDeletion,
    invalidateAfterMessageSent,
    invalidateAfterFeedback,

    // Direct query client access
    queryClient,
  }
}

/**
 * Cache management utilities
 */
export const useCacheManagement = () => {
  const queryClient = useQueryClient()

  const clearAllCache = useCallback(() => {
    queryClient.clear()
  }, [queryClient])

  const removeStaleQueries = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) => {
        return query.isStale()
      },
    })
  }, [queryClient])

  const prefetchApp = useCallback(async (appId: string) => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.appDetail(appId),
      queryFn: () => import('@/service/apps').then(({ get }) => get(`/apps/${appId}`)),
    })
  }, [queryClient])

  const prefetchConversations = useCallback(async (appId: string) => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.conversations(appId),
      queryFn: () => import('@/service/apps').then(({ get }) => get('/conversations', { params: { app_id: appId } })),
    })
  }, [queryClient])

  const setQueryData = useCallback(<T>(queryKey: any[], data: T) => {
    queryClient.setQueryData(queryKey, data)
  }, [queryClient])

  const getQueryData = useCallback(<T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey)
  }, [queryClient])

  return {
    clearAllCache,
    removeStaleQueries,
    prefetchApp,
    prefetchConversations,
    setQueryData,
    getQueryData,
    queryClient,
  }
}

/**
 * Smart invalidation based on data relationships
 */
export const useSmartInvalidation = () => {
  const { invalidateAfterMessageSent, invalidateAfterConversationCreation, invalidateAfterAppCreation } = useQueryInvalidation()
  const { queryClient } = useCacheManagement()

  const handleDataMutation = useCallback((
    type: 'app_created' | 'conversation_created' | 'message_sent' | 'conversation_deleted' | 'app_deleted',
    data: {
      appId?: string
      conversationId?: string
      messageId?: string
    },
  ) => {
    switch (type) {
      case 'app_created':
        invalidateAfterAppCreation()
        break

      case 'conversation_created':
        if (data.appId)
          invalidateAfterConversationCreation(data.appId)

        break

      case 'message_sent':
        if (data.conversationId)
          invalidateAfterMessageSent(data.conversationId, data.appId)

        break

      case 'conversation_deleted':
        if (data.conversationId && data.appId) {
          queryClient.removeQueries({ queryKey: QUERY_KEYS.conversationDetail(data.conversationId) })
          queryClient.removeQueries({ queryKey: QUERY_KEYS.messages(data.conversationId) })
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations(data.appId) })
        }
        break

      case 'app_deleted':
        if (data.appId) {
          queryClient.removeQueries({ queryKey: QUERY_KEYS.appDetail(data.appId) })
          queryClient.removeQueries({ queryKey: QUERY_KEYS.conversations(data.appId) })
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apps })
        }
        break
    }
  }, [invalidateAfterMessageSent, invalidateAfterConversationCreation, invalidateAfterAppCreation, queryClient])

  return {
    handleDataMutation,
  }
}

export default useQueryInvalidation
