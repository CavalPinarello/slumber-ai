// Specialized modal components for common use cases

import React from 'react'
import { useModal } from './modal-manager'
import { Form } from '@/components/composition/ui-patterns'
import { UnifiedLoading } from '@/components/loading/unified-loading'
import Button from '@/app/components/base/button'
import { useConversationMutations } from '@/service/mutation-patterns'
import type { ConversationItem } from '@/types/chat'

/**
 * Confirmation modals for common actions
 */
export const useConfirmationModals = () => {
  const modal = useModal()

  const confirmDelete = React.useCallback((options: {
    itemName: string
    itemType: string
    onConfirm: () => void | Promise<void>
    destructive?: boolean
  }) => {
    return modal.confirm({
      title: `Delete ${options.itemType}`,
      message: (
        <div className="space-y-3">
          <p>
            Are you sure you want to delete "<strong>{options.itemName}</strong>"?
          </p>
          <p className="text-sm text-text-secondary">
            This action cannot be undone.
          </p>
        </div>
      ),
      onConfirm: options.onConfirm,
      variant: options.destructive !== false ? 'destructive' : 'default',
    })
  }, [modal])

  const confirmBatchDelete = React.useCallback((options: {
    count: number
    itemType: string
    onConfirm: () => void | Promise<void>
  }) => {
    return modal.confirm({
      title: `Delete ${options.count} ${options.itemType}s`,
      message: (
        <div className="space-y-3">
          <p>
            Are you sure you want to delete {options.count} {options.itemType}s?
          </p>
          <p className="text-sm text-text-secondary">
            This action cannot be undone.
          </p>
        </div>
      ),
      onConfirm: options.onConfirm,
      variant: 'destructive',
    })
  }, [modal])

  const confirmUnsavedChanges = React.useCallback((options: {
    onConfirm: () => void | Promise<void>
    onCancel?: () => void
  }) => {
    return modal.confirm({
      title: 'Unsaved Changes',
      message: (
        <div className="space-y-3">
          <p>You have unsaved changes that will be lost.</p>
          <p className="text-sm text-text-secondary">
            Do you want to continue without saving?
          </p>
        </div>
      ),
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    })
  }, [modal])

  return {
    confirmDelete,
    confirmBatchDelete,
    confirmUnsavedChanges,
  }
}

/**
 * Conversation management modals
 */
export const useConversationModals = () => {
  const modal = useModal()
  const { createConversation, updateConversation, deleteConversation } = useConversationMutations()
  const { confirmDelete } = useConfirmationModals()

  const showCreateConversationModal = React.useCallback((appId: string) => {
    return modal.show({
      variant: 'form',
      title: 'New Conversation',
      size: 'md',
      content: <CreateConversationForm appId={appId} />,
    })
  }, [modal])

  const showRenameConversationModal = React.useCallback((
    conversation: ConversationItem,
    appId: string,
  ) => {
    return modal.show({
      variant: 'form',
      title: 'Rename Conversation',
      size: 'md',
      content: <RenameConversationForm conversation={conversation} appId={appId} />,
    })
  }, [modal])

  const showDeleteConversationModal = React.useCallback((
    conversation: ConversationItem,
    appId: string,
  ) => {
    return confirmDelete({
      itemName: conversation.name,
      itemType: 'conversation',
      onConfirm: async () => {
        await deleteConversation.mutateAsync({
          id: conversation.id,
          appId,
        })
      },
    })
  }, [confirmDelete, deleteConversation])

  return {
    showCreateConversationModal,
    showRenameConversationModal,
    showDeleteConversationModal,
  }
}

/**
 * Create conversation form component
 */
const CreateConversationForm: React.FC<{ appId: string }> = ({ appId }) => {
  const modal = useModal()
  const { createConversation } = useConversationMutations()
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim())
      return

    setIsSubmitting(true)
    try {
      await createConversation.mutateAsync({
        appId,
        name: formData.name.trim(),
      })
      modal.closeAll()
    }
    catch (error) {
      console.error('Failed to create conversation:', error)
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      onSubmit={handleSubmit}
      loading={isSubmitting}
      actions={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() => modal.closeAll()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.name.trim()}
          >
            {isSubmitting
              ? (
                <UnifiedLoading variant="spinner" size="sm" position="inline" />
              )
              : (
                'Create'
              )}
          </Button>
        </>
      }
    >
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Conversation Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-divider-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Enter conversation name..."
          maxLength={100}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Description (Optional)
        </label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-divider-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Brief description of the conversation..."
          rows={3}
          maxLength={500}
        />
      </div>
    </Form>
  )
}

/**
 * Rename conversation form component
 */
const RenameConversationForm: React.FC<{
  conversation: ConversationItem
  appId: string
}> = ({ conversation, appId }) => {
  const modal = useModal()
  const { updateConversation } = useConversationMutations()
  const [name, setName] = React.useState(conversation.name)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name.trim() === conversation.name)
      return

    setIsSubmitting(true)
    try {
      await updateConversation.mutateAsync({
        id: conversation.id,
        appId,
        updates: { name: name.trim() },
      })
      modal.closeAll()
    }
    catch (error) {
      console.error('Failed to rename conversation:', error)
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      onSubmit={handleSubmit}
      loading={isSubmitting}
      actions={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() => modal.closeAll()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || name.trim() === conversation.name}
          >
            {isSubmitting
              ? (
                <UnifiedLoading variant="spinner" size="sm" position="inline" />
              )
              : (
                'Rename'
              )}
          </Button>
        </>
      }
    >
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Conversation Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 border border-divider-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Enter new name..."
          maxLength={100}
          autoFocus
        />
      </div>
    </Form>
  )
}

/**
 * Error reporting modal
 */
export const useErrorReportModal = () => {
  const modal = useModal()

  const showErrorReport = React.useCallback((error: Error, context?: string) => {
    return modal.show({
      title: 'Error Report',
      size: 'lg',
      content: <ErrorReportContent error={error} context={context} />,
      actions: (
        <Button onClick={() => modal.closeAll()}>
          Close
        </Button>
      ),
    })
  }, [modal])

  return { showErrorReport }
}

/**
 * Error report content component
 */
const ErrorReportContent: React.FC<{
  error: Error
  context?: string
}> = ({ error, context }) => {
  const [reportSent, setReportSent] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)

  const handleSendReport = async () => {
    setIsSending(true)
    try {
      // Simulate sending error report
      await new Promise(resolve => setTimeout(resolve, 1500))
      setReportSent(true)
    }
    catch (err) {
      console.error('Failed to send error report:', err)
    }
    finally {
      setIsSending(false)
    }
  }

  if (reportSent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">✅</div>
        <div>
          <h3 className="text-lg font-medium text-text-primary">Report Sent</h3>
          <p className="text-text-secondary mt-2">
            Thank you for reporting this error. We'll investigate the issue.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-3">
          An error occurred
        </h3>
        <div className="bg-background-secondary p-4 rounded-md border border-divider-subtle">
          <div className="text-sm">
            <div className="font-medium text-text-primary mb-2">Error Message:</div>
            <div className="text-text-secondary font-mono text-xs bg-background-default p-2 rounded">
              {error.message}
            </div>
          </div>

          {context && (
            <div className="mt-3 text-sm">
              <div className="font-medium text-text-primary mb-2">Context:</div>
              <div className="text-text-secondary">
                {context}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-divider-subtle">
        <div className="text-sm text-text-secondary">
          Send this error report to help us improve the application
        </div>
        <Button
          onClick={handleSendReport}
          disabled={isSending}
          size="small"
        >
          {isSending
            ? (
              <UnifiedLoading variant="spinner" size="sm" position="inline" />
            )
            : (
              'Send Report'
            )}
        </Button>
      </div>
    </div>
  )
}

/**
 * Information/help modals
 */
export const useInfoModals = () => {
  const modal = useModal()

  const showKeyboardShortcuts = React.useCallback(() => {
    return modal.show({
      title: 'Keyboard Shortcuts',
      size: 'md',
      content: <KeyboardShortcutsContent />,
    })
  }, [modal])

  const showAbout = React.useCallback(() => {
    return modal.show({
      title: 'About',
      size: 'sm',
      content: <AboutContent />,
    })
  }, [modal])

  return {
    showKeyboardShortcuts,
    showAbout,
  }
}

/**
 * Keyboard shortcuts content
 */
const KeyboardShortcutsContent: React.FC = () => {
  const shortcuts = [
    { key: 'Ctrl/Cmd + K', description: 'Open command palette' },
    { key: 'Ctrl/Cmd + N', description: 'New conversation' },
    { key: 'Ctrl/Cmd + Enter', description: 'Send message' },
    { key: 'Escape', description: 'Close modal/dialog' },
    { key: 'Ctrl/Cmd + /', description: 'Show keyboard shortcuts' },
    { key: 'Ctrl/Cmd + ,', description: 'Open settings' },
  ]

  return (
    <div className="space-y-4">
      <p className="text-text-secondary">
        Use these keyboard shortcuts to navigate more efficiently:
      </p>

      <div className="space-y-3">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-text-primary">{shortcut.description}</span>
            <kbd className="px-2 py-1 text-xs font-mono bg-background-secondary border border-divider-subtle rounded">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * About content
 */
const AboutContent: React.FC = () => {
  return (
    <div className="space-y-4 text-center">
      <div className="text-4xl mb-4">💬</div>
      <div>
        <h3 className="text-lg font-semibold text-text-primary">
          Chat Application
        </h3>
        <p className="text-text-secondary mt-2">
          Version 1.0.0
        </p>
      </div>

      <div className="text-sm text-text-secondary space-y-2">
        <p>
          Built with Next.js, React Query, and TypeScript
        </p>
        <p>
          Powered by Dify AI platform
        </p>
      </div>

      <div className="pt-4 border-t border-divider-subtle">
        <p className="text-xs text-text-tertiary">
          © 2024 Your Company. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default {
  useConfirmationModals,
  useConversationModals,
  useErrorReportModal,
  useInfoModals,
}
