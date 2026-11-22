// Unified modal/dialog management system with context and programmatic API

import React from 'react'
import { createPortal } from 'react-dom'
import { Modal } from '@/components/composition/ui-patterns'
import { QueryErrorBoundary } from '@/components/error-boundaries/query-error-boundary'
import { UnifiedLoading } from '@/components/loading/unified-loading'
import Button from '@/app/components/base/button'
import cn from '@/utils/classnames'

/**
 * Modal configuration interface
 */
export type ModalConfig = {
  id: string
  title?: string
  content: React.ReactNode
  actions?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'confirmation' | 'alert' | 'form'
  closable?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  loading?: boolean
  error?: Error | null
  onClose?: () => void
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  className?: string
  zIndex?: number
  persistent?: boolean
}

/**
 * Modal stack item with metadata
 */
type ModalStackItem = {
  timestamp: number
  isClosing: boolean
} & ModalConfig

/**
 * Modal manager context
 */
type ModalManagerContextValue = {
  modals: ModalStackItem[]
  openModal: (config: Omit<ModalConfig, 'id'> & { id?: string }) => string
  closeModal: (id: string) => void
  closeAllModals: () => void
  updateModal: (id: string, updates: Partial<ModalConfig>) => void
  isModalOpen: (id: string) => boolean
  getModal: (id: string) => ModalStackItem | undefined
}

const ModalManagerContext = React.createContext<ModalManagerContextValue | null>(null)

/**
 * Hook to use modal manager
 */
export const useModalManager = () => {
  const context = React.useContext(ModalManagerContext)
  if (!context)
    throw new Error('useModalManager must be used within a ModalManagerProvider')

  return context
}

/**
 * Generate unique modal ID
 */
const generateModalId = () => `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * Modal manager provider component
 */
export const ModalManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modals, setModals] = React.useState<ModalStackItem[]>([])

  const openModal = React.useCallback((config: Omit<ModalConfig, 'id'> & { id?: string }) => {
    const id = config.id || generateModalId()
    const newModal: ModalStackItem = {
      ...config,
      id,
      timestamp: Date.now(),
      isClosing: false,
      closable: config.closable !== false,
      closeOnBackdrop: config.closeOnBackdrop !== false,
      closeOnEscape: config.closeOnEscape !== false,
      zIndex: config.zIndex || 1000 + modals.length,
    }

    setModals(prev => [...prev, newModal])
    return id
  }, [modals.length])

  const closeModal = React.useCallback((id: string) => {
    setModals((prev) => {
      const modal = prev.find(m => m.id === id)
      if (!modal)
        return prev

      // Mark as closing for animation
      const updatedModals = prev.map(m =>
        m.id === id ? { ...m, isClosing: true } : m,
      )

      // Remove after animation delay
      setTimeout(() => {
        setModals(current => current.filter(m => m.id !== id))
      }, 150)

      return updatedModals
    })
  }, [])

  const closeAllModals = React.useCallback(() => {
    setModals(prev =>
      prev.map(modal => ({ ...modal, isClosing: true })),
    )

    setTimeout(() => {
      setModals([])
    }, 150)
  }, [])

  const updateModal = React.useCallback((id: string, updates: Partial<ModalConfig>) => {
    setModals(prev =>
      prev.map(modal =>
        modal.id === id ? { ...modal, ...updates } : modal,
      ),
    )
  }, [])

  const isModalOpen = React.useCallback((id: string) => {
    return modals.some(modal => modal.id === id && !modal.isClosing)
  }, [modals])

  const getModal = React.useCallback((id: string) => {
    return modals.find(modal => modal.id === id)
  }, [modals])

  const value: ModalManagerContextValue = {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    updateModal,
    isModalOpen,
    getModal,
  }

  return (
    <ModalManagerContext.Provider value={value}>
      {children}
      <ModalStack modals={modals} onClose={closeModal} />
    </ModalManagerContext.Provider>
  )
}

/**
 * Modal stack renderer
 */
const ModalStack: React.FC<{
  modals: ModalStackItem[]
  onClose: (id: string) => void
}> = ({ modals, onClose }) => {
  const [container, setContainer] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    const modalContainer = document.getElementById('modal-root') || document.body
    setContainer(modalContainer)
  }, [])

  if (!container)
    return null

  return createPortal(
    <>
      {modals.map((modal, index) => (
        <ModalRenderer
          key={modal.id}
          modal={modal}
          onClose={onClose}
          stackIndex={index}
          isTopmost={index === modals.length - 1}
        />
      ))}
    </>,
    container,
  )
}

/**
 * Individual modal renderer
 */
const ModalRenderer: React.FC<{
  modal: ModalStackItem
  onClose: (id: string) => void
  stackIndex: number
  isTopmost: boolean
}> = ({ modal, onClose, stackIndex, isTopmost }) => {
  const handleClose = React.useCallback(() => {
    if (modal.closable && !modal.persistent) {
      modal.onClose?.()
      onClose(modal.id)
    }
  }, [modal, onClose])

  const handleBackdropClick = React.useCallback(() => {
    if (modal.closeOnBackdrop)
      handleClose()
  }, [modal.closeOnBackdrop, handleClose])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal.closeOnEscape && isTopmost)
        handleClose()
    }

    if (isTopmost) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [modal.closeOnEscape, isTopmost, handleClose])

  const renderModalContent = () => {
    switch (modal.variant) {
      case 'confirmation':
        return <ConfirmationModal modal={modal} onClose={handleClose} />
      case 'alert':
        return <AlertModal modal={modal} onClose={handleClose} />
      case 'form':
        return <FormModal modal={modal} onClose={handleClose} />
      default:
        return <DefaultModal modal={modal} onClose={handleClose} />
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center transition-all duration-150',
        modal.isClosing ? 'opacity-0' : 'opacity-100',
      )}
      style={{ zIndex: modal.zIndex }}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black transition-opacity duration-150',
          isTopmost ? 'bg-opacity-50 backdrop-blur-sm' : 'bg-opacity-20',
          modal.isClosing ? 'opacity-0' : 'opacity-100',
        )}
        onClick={handleBackdropClick}
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative transition-all duration-150',
          modal.isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100',
        )}
      >
        <QueryErrorBoundary variant="component">
          {renderModalContent()}
        </QueryErrorBoundary>
      </div>
    </div>
  )
}

/**
 * Default modal variant
 */
const DefaultModal: React.FC<{
  modal: ModalStackItem
  onClose: () => void
}> = ({ modal, onClose }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title={modal.title}
    size={modal.size}
    loading={modal.loading}
    error={modal.error}
    actions={modal.actions}
  >
    {modal.content}
  </Modal>
)

/**
 * Confirmation modal variant
 */
const ConfirmationModal: React.FC<{
  modal: ModalStackItem
  onClose: () => void
}> = ({ modal, onClose }) => {
  const [isConfirming, setIsConfirming] = React.useState(false)

  const handleConfirm = async () => {
    if (modal.onConfirm) {
      setIsConfirming(true)
      try {
        await modal.onConfirm()
        onClose()
      }
      catch (error) {
        console.error('Confirmation error:', error)
      }
      finally {
        setIsConfirming(false)
      }
    }
    else {
      onClose()
    }
  }

  const handleCancel = () => {
    modal.onCancel?.()
    onClose()
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={modal.title || 'Confirm Action'}
      size={modal.size || 'sm'}
      loading={modal.loading || isConfirming}
      error={modal.error}
      actions={
        <>
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming
              ? (
                <UnifiedLoading variant="spinner" size="sm" position="inline" />
              )
              : (
                'Confirm'
              )}
          </Button>
        </>
      }
    >
      {modal.content}
    </Modal>
  )
}

/**
 * Alert modal variant
 */
const AlertModal: React.FC<{
  modal: ModalStackItem
  onClose: () => void
}> = ({ modal, onClose }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title={modal.title || 'Alert'}
    size={modal.size || 'sm'}
    loading={modal.loading}
    error={modal.error}
    actions={
      <Button onClick={onClose}>
        OK
      </Button>
    }
  >
    {modal.content}
  </Modal>
)

/**
 * Form modal variant
 */
const FormModal: React.FC<{
  modal: ModalStackItem
  onClose: () => void
}> = ({ modal, onClose }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async () => {
    if (modal.onConfirm) {
      setIsSubmitting(true)
      try {
        await modal.onConfirm()
        onClose()
      }
      catch (error) {
        console.error('Form submission error:', error)
      }
      finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={modal.title || 'Form'}
      size={modal.size || 'md'}
      loading={modal.loading || isSubmitting}
      error={modal.error}
      actions={
        modal.actions || (
          <>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (
                  <UnifiedLoading variant="spinner" size="sm" position="inline" />
                )
                : (
                  'Save'
                )}
            </Button>
          </>
        )
      }
    >
      {modal.content}
    </Modal>
  )
}

/**
 * Programmatic modal API
 */
export const modalApi = {
  /**
   * Show a confirmation dialog
   */
  confirm: (options: {
    title?: string
    message: React.ReactNode
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void | Promise<void>
    onCancel?: () => void
    variant?: 'default' | 'destructive'
  }) => {
    // This will be implemented by the hook
    console.warn('modalApi.confirm called outside of ModalManagerProvider')
  },

  /**
   * Show an alert dialog
   */
  alert: (options: {
    title?: string
    message: React.ReactNode
    buttonText?: string
  }) => {
    console.warn('modalApi.alert called outside of ModalManagerProvider')
  },

  /**
   * Show a custom modal
   */
  show: (config: Omit<ModalConfig, 'id'> & { id?: string }) => {
    console.warn('modalApi.show called outside of ModalManagerProvider')
    return ''
  },

  /**
   * Close a modal by ID
   */
  close: (id: string) => {
    console.warn('modalApi.close called outside of ModalManagerProvider')
  },

  /**
   * Close all modals
   */
  closeAll: () => {
    console.warn('modalApi.closeAll called outside of ModalManagerProvider')
  },
}

/**
 * Hook that provides the programmatic modal API
 */
export const useModal = () => {
  const { openModal, closeModal, closeAllModals, updateModal, isModalOpen, getModal } = useModalManager()

  const confirm = React.useCallback((options: {
    title?: string
    message: React.ReactNode
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void | Promise<void>
    onCancel?: () => void
    variant?: 'default' | 'destructive'
  }) => {
    return openModal({
      variant: 'confirmation',
      title: options.title,
      content: options.message,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      size: 'sm',
    })
  }, [openModal])

  const alert = React.useCallback((options: {
    title?: string
    message: React.ReactNode
    buttonText?: string
  }) => {
    return openModal({
      variant: 'alert',
      title: options.title,
      content: options.message,
      size: 'sm',
    })
  }, [openModal])

  return {
    show: openModal,
    close: closeModal,
    closeAll: closeAllModals,
    update: updateModal,
    isOpen: isModalOpen,
    get: getModal,
    confirm,
    alert,
  }
}

/**
 * Higher-order component to wrap app with modal manager
 */
export const withModalManager = <P extends object>(
  Component: React.ComponentType<P>,
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ModalManagerProvider>
      <Component {...props} ref={ref} />
    </ModalManagerProvider>
  ))
}

export default ModalManagerProvider
