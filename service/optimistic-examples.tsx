// Examples and usage patterns for optimistic updates

import React from 'react'
import {
  useBatchMutations,
  useConversationMutations,
  useMessageMutations,
} from './mutation-patterns'
import { useOptimisticUpdates } from './optimistic-updates'
import Button from '@/app/components/base/button'
import { UnifiedLoading } from '@/components/loading/unified-loading'
import { QueryErrorBoundary } from '@/components/error-boundaries/query-error-boundary'

/**
 * Example: Conversation management with optimistic updates
 */
export const ConversationManagerExample: React.FC<{ appId: string }> = ({ appId }) => {
  const { createConversation, updateConversation, deleteConversation, pinConversation } = useConversationMutations()

  const handleCreateConversation = async () => {
    try {
      // Mutation automatically applies optimistic updates and handles rollback on error
      const newConversation = await createConversation.mutateAsync({
        appId,
        name: 'New Chat Session',
      })

      console.log('Conversation created:', newConversation)
    }
    catch (error) {
      console.error('Failed to create conversation:', error)
      // Optimistic update has already been rolled back automatically
    }
  }

  const handleRenameConversation = async (conversationId: string, newName: string) => {
    try {
      await updateConversation.mutateAsync({
        id: conversationId,
        appId,
        updates: { name: newName },
      })
    }
    catch (error) {
      console.error('Failed to rename conversation:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation.mutateAsync({
        id: conversationId,
        appId,
      })
    }
    catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleTogglePin = async (conversationId: string, isPinned: boolean) => {
    try {
      if (isPinned) {
        await pinConversation.mutateAsync({ id: conversationId, appId })
      }
      else {
        // For unpin, you'd use unpinConversation mutation
      }
    }
    catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  return (
    <QueryErrorBoundary variant="component">
      <div className="space-y-4">
        <Button
          onClick={handleCreateConversation}
          disabled={createConversation.isPending}
        >
          {createConversation.isPending
            ? (
              <UnifiedLoading variant="spinner" size="sm" position="inline" />
            )
            : (
              'Create New Conversation'
            )}
        </Button>

        {/* Other conversation management UI */}
        <div className="text-sm text-text-secondary">
          Conversations will appear instantly when created due to optimistic updates,
          and will automatically rollback if the creation fails.
        </div>
      </div>
    </QueryErrorBoundary>
  )
}

/**
 * Example: Message operations with optimistic updates
 */
export const MessageOperationsExample: React.FC<{
  conversationId: string
  messageId: string
}> = ({ conversationId, messageId }) => {
  const { sendMessage, updateMessageFeedback, regenerateMessage } = useMessageMutations()

  const handleSendMessage = async (content: string) => {
    try {
      // Message appears immediately in the UI, then gets replaced with server response
      await sendMessage.mutateAsync({
        conversationId,
        message: content,
      })
    }
    catch (error) {
      console.error('Failed to send message:', error)
      // Optimistic message has been removed automatically
    }
  }

  const handleLikeMessage = async () => {
    try {
      // Feedback appears immediately in the UI
      await updateMessageFeedback.mutateAsync({
        messageId,
        conversationId,
        feedback: { rating: 'like' },
      })
    }
    catch (error) {
      console.error('Failed to update feedback:', error)
      // Feedback has been reverted automatically
    }
  }

  const handleRegenerateMessage = async () => {
    try {
      // Loading indicator appears immediately
      await regenerateMessage.mutateAsync({
        messageId,
        conversationId,
      })
    }
    catch (error) {
      console.error('Failed to regenerate message:', error)
    }
  }

  return (
    <div className="space-x-2">
      <Button
        size="small"
        onClick={handleLikeMessage}
        disabled={updateMessageFeedback.isPending}
      >
        👍 Like
      </Button>

      <Button
        size="small"
        onClick={handleRegenerateMessage}
        disabled={regenerateMessage.isPending}
      >
        🔄 Regenerate
      </Button>
    </div>
  )
}

/**
 * Example: Batch operations with optimistic updates
 */
export const BatchOperationsExample: React.FC<{
  appId: string
  selectedConversationIds: string[]
}> = ({ appId, selectedConversationIds }) => {
  const { batchDeleteConversations } = useBatchMutations()

  const handleBatchDelete = async () => {
    if (selectedConversationIds.length === 0)
      return

    try {
      // All selected conversations disappear immediately from the UI
      await batchDeleteConversations.mutateAsync({
        conversationIds: selectedConversationIds,
        appId,
      })
    }
    catch (error) {
      console.error('Failed to delete conversations:', error)
      // All conversations have been restored automatically
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleBatchDelete}
      disabled={batchDeleteConversations.isPending || selectedConversationIds.length === 0}
    >
      {batchDeleteConversations.isPending
        ? (
          <UnifiedLoading variant="spinner" size="sm" position="inline" />
        )
        : (
          `Delete ${selectedConversationIds.length} Conversations`
        )}
    </Button>
  )
}

/**
 * Example: Advanced optimistic updates with manual control
 */
export const AdvancedOptimisticExample: React.FC<{ appId: string }> = ({ appId }) => {
  const {
    optimisticallyCreateConversation,
    optimisticallyUpdateConversation,
    replaceTemporaryConversation,
  } = useOptimisticUpdates()

  const handleManualOptimisticUpdate = async () => {
    // Manual optimistic update with custom logic
    const { tempConversation, rollback } = optimisticallyCreateConversation(appId, {
      name: 'Custom Optimistic Conversation',
    })

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate server response
      const serverResponse = {
        ...tempConversation,
        id: 'real-server-id',
        created_at: new Date().toISOString(),
      }

      // Replace with real data
      replaceTemporaryConversation(appId, tempConversation.id, serverResponse)
    }
    catch (error) {
      // Rollback on error
      rollback()
      console.error('Manual optimistic update failed:', error)
    }
  }

  const handleChainedOptimisticUpdates = async () => {
    // Example of chaining multiple optimistic updates
    const { tempConversation, rollback: rollbackCreate } = optimisticallyCreateConversation(appId, {
      name: 'Conversation to be renamed',
    })

    // Immediately rename the conversation optimistically
    const { rollback: rollbackUpdate } = optimisticallyUpdateConversation(
      tempConversation.id,
      appId,
      { name: 'Renamed Conversation' },
    )

    try {
      // Simulate complex operation
      await new Promise(resolve => setTimeout(resolve, 1000))

      // If successful, you would replace with real server data
      // If failed, rollback both operations
    }
    catch (error) {
      rollbackUpdate()
      rollbackCreate()
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleManualOptimisticUpdate}>
        Manual Optimistic Update Example
      </Button>

      <Button onClick={handleChainedOptimisticUpdates}>
        Chained Optimistic Updates Example
      </Button>

      <div className="text-sm text-text-secondary">
        These examples show advanced patterns for manual optimistic update control.
        For most use cases, the automatic mutations from mutation-patterns.ts are sufficient.
      </div>
    </div>
  )
}

/**
 * Example: Optimistic updates with loading states
 */
export const OptimisticLoadingExample: React.FC<{ appId: string }> = ({ appId }) => {
  const { createConversation } = useConversationMutations()
  const [isOptimisticLoading, setIsOptimisticLoading] = React.useState(false)

  const handleCreateWithCustomLoading = async () => {
    setIsOptimisticLoading(true)

    try {
      await createConversation.mutateAsync({
        appId,
        name: 'Conversation with Custom Loading',
      })
    }
    catch (error) {
      console.error('Failed to create conversation:', error)
    }
    finally {
      setIsOptimisticLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleCreateWithCustomLoading}
        disabled={isOptimisticLoading || createConversation.isPending}
      >
        {isOptimisticLoading
          ? (
            <>
              <UnifiedLoading variant="spinner" size="sm" position="inline" />
            Creating...
            </>
          )
          : (
            'Create with Custom Loading'
          )}
      </Button>

      <div className="text-sm text-text-secondary">
        This example shows how to combine optimistic updates with custom loading states
        for enhanced user experience.
      </div>
    </div>
  )
}

export default {
  ConversationManagerExample,
  MessageOperationsExample,
  BatchOperationsExample,
  AdvancedOptimisticExample,
  OptimisticLoadingExample,
}
