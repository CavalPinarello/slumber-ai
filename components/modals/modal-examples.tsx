// Examples and usage patterns for the unified modal system

import React from 'react'
import {
  ModalManagerProvider,
  useModal,
  useModalManager,
} from './modal-manager'
import {
  useConfirmationModals,
  useConversationModals,
  useErrorReportModal,
  useInfoModals,
} from './specialized-modals'
import { Card } from '@/components/composition/ui-patterns'
import Button from '@/app/components/base/button'

/**
 * Example: Basic modal usage
 */
export const BasicModalExample: React.FC = () => {
  const modal = useModal()
  const [counter, setCounter] = React.useState(0)

  const showBasicModal = () => {
    modal.show({
      title: 'Basic Modal',
      content: (
        <div className="space-y-4">
          <p>This is a basic modal with custom content.</p>
          <div className="flex items-center space-x-4">
            <span>Counter: {counter}</span>
            <Button size="small" onClick={() => setCounter(c => c + 1)}>
              Increment
            </Button>
          </div>
        </div>
      ),
      actions: (
        <Button onClick={() => modal.closeAll()}>
          Close
        </Button>
      ),
    })
  }

  const showCustomSizeModal = () => {
    modal.show({
      title: 'Large Modal',
      size: 'lg',
      content: (
        <div>
          <p>This modal uses a larger size.</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-background-secondary rounded">Column 1</div>
            <div className="p-4 bg-background-secondary rounded">Column 2</div>
          </div>
        </div>
      ),
    })
  }

  const showPersistentModal = () => {
    modal.show({
      title: 'Persistent Modal',
      persistent: true,
      closeOnBackdrop: false,
      closeOnEscape: false,
      content: (
        <div>
          <p>This modal cannot be closed by clicking outside or pressing escape.</p>
          <p className="text-sm text-text-secondary mt-2">
            Use the close button to dismiss it.
          </p>
        </div>
      ),
      actions: (
        <Button onClick={() => modal.closeAll()}>
          Close Modal
        </Button>
      ),
    })
  }

  return (
    <Card
      title="Basic Modal Examples"
      content={
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button onClick={showBasicModal} size="small">
              Basic Modal
            </Button>
            <Button onClick={showCustomSizeModal} size="small">
              Large Modal
            </Button>
            <Button onClick={showPersistentModal} size="small">
              Persistent Modal
            </Button>
          </div>
          <p className="text-sm text-text-secondary">
            Current counter value (shared between modal and page): {counter}
          </p>
        </div>
      }
    />
  )
}

/**
 * Example: Confirmation modals
 */
export const ConfirmationModalExample: React.FC = () => {
  const { confirmDelete, confirmBatchDelete, confirmUnsavedChanges } = useConfirmationModals()
  const modal = useModal()
  const [items, setItems] = React.useState([
    { id: 1, name: 'Document 1' },
    { id: 2, name: 'Document 2' },
    { id: 3, name: 'Document 3' },
  ])

  const handleDeleteItem = (item: typeof items[0]) => {
    confirmDelete({
      itemName: item.name,
      itemType: 'document',
      onConfirm: async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setItems(prev => prev.filter(i => i.id !== item.id))
      },
    })
  }

  const handleBatchDelete = () => {
    confirmBatchDelete({
      count: items.length,
      itemType: 'document',
      onConfirm: async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setItems([])
      },
    })
  }

  const handleUnsavedChanges = () => {
    confirmUnsavedChanges({
      onConfirm: () => {
        modal.alert({
          title: 'Changes Discarded',
          message: 'Your unsaved changes have been discarded.',
        })
      },
    })
  }

  return (
    <Card
      title="Confirmation Modal Examples"
      content={
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Documents</h4>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-background-secondary rounded">
                  <span>{item.name}</span>
                  <Button
                    size="small"
                    variant="destructive"
                    onClick={() => handleDeleteItem(item)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-text-secondary text-center py-4">
                  No documents remaining
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleBatchDelete}
              variant="destructive"
              size="small"
              disabled={items.length === 0}
            >
              Delete All ({items.length})
            </Button>
            <Button
              onClick={handleUnsavedChanges}
              variant="ghost"
              size="small"
            >
              Simulate Unsaved Changes
            </Button>
          </div>
        </div>
      }
    />
  )
}

/**
 * Example: Conversation modals
 */
export const ConversationModalExample: React.FC = () => {
  const { showCreateConversationModal, showRenameConversationModal, showDeleteConversationModal } = useConversationModals()
  const [conversations, setConversations] = React.useState([
    { id: '1', name: 'General Discussion', message_count: 5 },
    { id: '2', name: 'Project Planning', message_count: 12 },
    { id: '3', name: 'Team Updates', message_count: 3 },
  ])

  const appId = 'example-app-id'

  const handleCreateConversation = () => {
    showCreateConversationModal(appId)
  }

  const handleRenameConversation = (conversation: any) => {
    showRenameConversationModal(conversation, appId)
  }

  const handleDeleteConversation = (conversation: any) => {
    showDeleteConversationModal(conversation, appId)
  }

  return (
    <Card
      title="Conversation Modal Examples"
      content={
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Conversations</h4>
              <Button onClick={handleCreateConversation} size="small">
                New Conversation
              </Button>
            </div>
            <div className="space-y-2">
              {conversations.map(conversation => (
                <div key={conversation.id} className="flex items-center justify-between p-3 bg-background-secondary rounded">
                  <div>
                    <div className="font-medium">{conversation.name}</div>
                    <div className="text-sm text-text-secondary">
                      {conversation.message_count} messages
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="small"
                      variant="ghost"
                      onClick={() => handleRenameConversation(conversation)}
                    >
                      Rename
                    </Button>
                    <Button
                      size="small"
                      variant="destructive"
                      onClick={() => handleDeleteConversation(conversation)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-text-secondary">
            Note: These examples use mock data. In a real application,
            they would integrate with your conversation API.
          </p>
        </div>
      }
    />
  )
}

/**
 * Example: Modal stacking
 */
export const ModalStackingExample: React.FC = () => {
  const modal = useModal()
  const { modals } = useModalManager()

  const showFirstModal = () => {
    modal.show({
      title: 'First Modal',
      content: (
        <div className="space-y-4">
          <p>This is the first modal in the stack.</p>
          <Button onClick={showSecondModal} size="small">
            Open Second Modal
          </Button>
        </div>
      ),
    })
  }

  const showSecondModal = () => {
    modal.show({
      title: 'Second Modal',
      content: (
        <div className="space-y-4">
          <p>This is the second modal, stacked on top of the first.</p>
          <Button onClick={showThirdModal} size="small">
            Open Third Modal
          </Button>
        </div>
      ),
      size: 'sm',
    })
  }

  const showThirdModal = () => {
    modal.show({
      title: 'Third Modal',
      content: (
        <div className="space-y-4">
          <p>This is the third modal in the stack.</p>
          <p className="text-sm text-text-secondary">
            Notice how the backdrop becomes more opaque as modals stack.
          </p>
          <div className="flex space-x-2">
            <Button onClick={() => modal.closeAll()} size="small" variant="destructive">
              Close All Modals
            </Button>
          </div>
        </div>
      ),
      size: 'sm',
    })
  }

  return (
    <Card
      title="Modal Stacking Example"
      content={
        <div className="space-y-4">
          <div>
            <p className="mb-3">
              Demonstrate modal stacking with multiple modals open simultaneously.
            </p>
            <Button onClick={showFirstModal}>
              Open First Modal
            </Button>
          </div>

          <div className="p-3 bg-background-secondary rounded">
            <div className="text-sm font-medium mb-2">Current Modal Stack:</div>
            <div className="text-sm text-text-secondary">
              {modals.length === 0
                ? (
                  'No modals open'
                )
                : (
                  <ul className="list-disc list-inside space-y-1">
                    {modals.map((modal, index) => (
                      <li key={modal.id}>
                        {modal.title || 'Untitled Modal'} (z-index: {modal.zIndex})
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>
        </div>
      }
    />
  )
}

/**
 * Example: Error and info modals
 */
export const ErrorInfoModalExample: React.FC = () => {
  const { showErrorReport } = useErrorReportModal()
  const { showKeyboardShortcuts, showAbout } = useInfoModals()
  const modal = useModal()

  const simulateError = () => {
    const error = new Error('Something went wrong while processing your request')
    showErrorReport(error, 'User clicked the simulate error button')
  }

  const showLoadingModal = () => {
    const modalId = modal.show({
      title: 'Processing...',
      loading: true,
      content: <p>Please wait while we process your request.</p>,
      closable: false,
    })

    // Simulate async operation
    setTimeout(() => {
      modal.update(modalId, {
        title: 'Success!',
        loading: false,
        content: (
          <div className="text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p>Your request has been processed successfully.</p>
          </div>
        ),
        actions: (
          <Button onClick={() => modal.close(modalId)}>
            Close
          </Button>
        ),
        closable: true,
      })
    }, 3000)
  }

  return (
    <Card
      title="Error & Info Modal Examples"
      content={
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={simulateError} size="small" variant="destructive">
            Simulate Error
          </Button>
          <Button onClick={showLoadingModal} size="small">
            Show Loading Modal
          </Button>
          <Button onClick={showKeyboardShortcuts} size="small" variant="ghost">
            Keyboard Shortcuts
          </Button>
          <Button onClick={showAbout} size="small" variant="ghost">
            About
          </Button>
        </div>
      }
    />
  )
}

/**
 * Example: Complete modal integration
 */
export const CompleteModalExample: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Modal System Examples
        </h2>
        <p className="text-text-secondary">
          Comprehensive examples of the unified modal system in action
        </p>
      </div>

      <div className="grid gap-6">
        <BasicModalExample />
        <ConfirmationModalExample />
        <ConversationModalExample />
        <ModalStackingExample />
        <ErrorInfoModalExample />
      </div>

      <div className="text-center">
        <p className="text-sm text-text-tertiary">
          All modals are managed by the unified modal system with
          consistent behavior, styling, and accessibility features.
        </p>
      </div>
    </div>
  )
}

/**
 * Example: App integration
 */
export const AppWithModals: React.FC = () => {
  return (
    <ModalManagerProvider>
      <div className="min-h-screen bg-background-default p-6">
        <CompleteModalExample />
      </div>

      {/* Modal root element for better portal management */}
      <div id="modal-root" />
    </ModalManagerProvider>
  )
}

export default {
  BasicModalExample,
  ConfirmationModalExample,
  ConversationModalExample,
  ModalStackingExample,
  ErrorInfoModalExample,
  CompleteModalExample,
  AppWithModals,
}
