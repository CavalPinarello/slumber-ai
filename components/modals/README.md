# Unified Modal/Dialog System

A comprehensive modal management system built on React portals with support for modal stacking, programmatic API, specialized components, and consistent accessibility features.

## Architecture Overview

### Core Files

1. **`modal-manager.tsx`** - Core modal management system with context and programmatic API
2. **`specialized-modals.tsx`** - Pre-built modal components for common use cases
3. **`modal-examples.tsx`** - Usage examples and integration patterns
4. **`README.md`** - This documentation

### Key Features

- **Modal Stacking**: Support for multiple modals with proper z-index management
- **Programmatic API**: Show/hide modals programmatically from anywhere in the app
- **Specialized Components**: Pre-built modals for confirmations, forms, errors, etc.
- **Accessibility**: Full keyboard navigation, focus management, and ARIA attributes
- **Portal Rendering**: Modals render outside the component tree using React portals
- **Animation Support**: Smooth open/close transitions with configurable timing
- **Error Boundaries**: Built-in error handling for modal content
- **TypeScript Support**: Fully typed with comprehensive interfaces

## Quick Start

### 1. Setup Modal Provider

Wrap your app with the `ModalManagerProvider`:

```tsx
import { ModalManagerProvider } from '@/components/modals/modal-manager'

function App() {
  return (
    <ModalManagerProvider>
      <YourAppContent />
      {/* Optional: dedicated modal root element */}
      <div id="modal-root" />
    </ModalManagerProvider>
  )
}
```

### 2. Use Modal Hook

Use the `useModal` hook to show modals programmatically:

```tsx
import { useModal } from '@/components/modals/modal-manager'

function MyComponent() {
  const modal = useModal()

  const showModal = () => {
    modal.show({
      title: 'Example Modal',
      content: <div>Modal content here</div>,
      actions: (
        <button onClick={() => modal.closeAll()}>
          Close
        </button>
      ),
    })
  }

  return <button onClick={showModal}>Open Modal</button>
}
```

### 3. Use Specialized Modals

Use pre-built specialized modal hooks for common patterns:

```tsx
import { useConfirmationModals } from '@/components/modals/specialized-modals'

function DeleteButton({ itemName, onDelete }) {
  const { confirmDelete } = useConfirmationModals()

  const handleDelete = () => {
    confirmDelete({
      itemName,
      itemType: 'item',
      onConfirm: onDelete,
    })
  }

  return <button onClick={handleDelete}>Delete</button>
}
```

## Modal Configuration

### Basic Modal Options

```tsx
type ModalConfig = {
  id?: string // Auto-generated if not provided
  title?: string // Modal title
  content: React.ReactNode // Modal content
  actions?: React.ReactNode // Footer actions
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'confirmation' | 'alert' | 'form'
  closable?: boolean // Show close button (default: true)
  closeOnBackdrop?: boolean // Close on backdrop click (default: true)
  closeOnEscape?: boolean // Close on Escape key (default: true)
  loading?: boolean // Show loading state
  error?: Error // Show error state
  persistent?: boolean // Prevent closing until explicitly closed
  className?: string // Custom CSS classes
  zIndex?: number // Custom z-index (auto-managed by default)
  onClose?: () => void // Close callback
  onConfirm?: () => void | Promise<void> // Confirm callback
  onCancel?: () => void // Cancel callback
}
```

### Modal Variants

#### Default Modal
```tsx
modal.show({
  title: 'Custom Modal',
  content: <YourComponent />,
  actions: <YourActions />,
})
```

#### Confirmation Modal
```tsx
modal.show({
  variant: 'confirmation',
  title: 'Confirm Action',
  content: 'Are you sure you want to proceed?',
  onConfirm: async () => {
    await performAction()
  },
})
```

#### Alert Modal
```tsx
modal.show({
  variant: 'alert',
  title: 'Information',
  content: 'This is an important message.',
})
```

#### Form Modal
```tsx
modal.show({
  variant: 'form',
  title: 'Edit Item',
  content: <YourForm />,
  onConfirm: async () => {
    await submitForm()
  },
})
```

## Programmatic API

### Core Methods

```tsx
const modal = useModal()

// Show a modal
const modalId = modal.show({
  title: 'Modal Title',
  content: <div>Content</div>,
})

// Close specific modal
modal.close(modalId)

// Close all modals
modal.closeAll()

// Update modal content
modal.update(modalId, {
  title: 'Updated Title',
  loading: true,
})

// Check if modal is open
const isOpen = modal.isOpen(modalId)

// Get modal data
const modalData = modal.get(modalId)
```

### Convenience Methods

```tsx
// Quick confirmation
modal.confirm({
  title: 'Delete Item',
  message: 'Are you sure?',
  onConfirm: () => deleteItem(),
})

// Quick alert
modal.alert({
  title: 'Success',
  message: 'Item was deleted successfully.',
})
```

## Specialized Modal Hooks

### Confirmation Modals

```tsx
import { useConfirmationModals } from '@/components/modals/specialized-modals'

const { confirmDelete, confirmBatchDelete, confirmUnsavedChanges } = useConfirmationModals()

// Delete confirmation
confirmDelete({
  itemName: 'Document.pdf',
  itemType: 'document',
  onConfirm: async () => {
    await deleteDocument()
  },
})

// Batch delete confirmation
confirmBatchDelete({
  count: 5,
  itemType: 'document',
  onConfirm: async () => {
    await deleteBatch()
  },
})

// Unsaved changes warning
confirmUnsavedChanges({
  onConfirm: () => {
    navigateAway()
  },
})
```

### Conversation Modals

```tsx
import { useConversationModals } from '@/components/modals/specialized-modals'

const {
  showCreateConversationModal,
  showRenameConversationModal,
  showDeleteConversationModal
} = useConversationModals()

// Create conversation
showCreateConversationModal(appId)

// Rename conversation
showRenameConversationModal(conversation, appId)

// Delete conversation
showDeleteConversationModal(conversation, appId)
```

### Error Reporting

```tsx
import { useErrorReportModal } from '@/components/modals/specialized-modals'

const { showErrorReport } = useErrorReportModal()

try {
  await riskyOperation()
}
catch (error) {
  showErrorReport(error, 'Failed during risky operation')
}
```

### Info Modals

```tsx
import { useInfoModals } from '@/components/modals/specialized-modals'

const { showKeyboardShortcuts, showAbout } = useInfoModals()

// Show keyboard shortcuts
showKeyboardShortcuts()

// Show about dialog
showAbout()
```

## Modal Stacking

The system supports multiple modals open simultaneously with proper stacking:

```tsx
const modal = useModal()

// Open first modal
const firstModal = modal.show({
  title: 'First Modal',
  content: (
    <button onClick={() => {
      // Open second modal on top
      modal.show({
        title: 'Second Modal',
        content: 'This modal is stacked on top',
        size: 'sm',
      })
    }}>
      Open Second Modal
    </button>
  ),
})
```

### Stack Management

- **Z-Index**: Automatically managed with increasing z-index values
- **Backdrop**: Lower modals have reduced backdrop opacity
- **Keyboard**: Escape key only affects the topmost modal
- **Focus**: Focus is trapped within the topmost modal

## Accessibility Features

### Keyboard Navigation

- **Escape Key**: Closes the topmost modal (if `closeOnEscape` is true)
- **Tab Navigation**: Focus is trapped within modal content
- **Return Focus**: Focus returns to trigger element on close

### ARIA Attributes

- `role="dialog"` on modal containers
- `aria-labelledby` linking to modal title
- `aria-describedby` linking to modal content
- `aria-modal="true"` on active modals

### Screen Reader Support

- Modal content is announced when opened
- Loading states are announced
- Error states are announced with appropriate urgency

## Integration Examples

### With React Query

```tsx
import { useMutation } from '@tanstack/react-query'
import { useModal } from '@/components/modals/modal-manager'

function DataForm() {
  const modal = useModal()
  const mutation = useMutation({
    mutationFn: saveData,
    onSuccess: () => {
      modal.alert({
        title: 'Success',
        message: 'Data saved successfully!',
      })
    },
    onError: (error) => {
      modal.show({
        variant: 'alert',
        title: 'Error',
        content: `Failed to save: ${error.message}`,
      })
    },
  })

  return (
    <button
      onClick={() => mutation.mutate(formData)}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Saving...' : 'Save'}
    </button>
  )
}
```

### With Form Libraries

```tsx
import { useForm } from 'react-hook-form'
import { useModal } from '@/components/modals/modal-manager'

function EditUserModal({ user, onSave }) {
  const modal = useModal()
  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: user,
  })

  const onSubmit = async (data) => {
    await onSave(data)
    modal.closeAll()
  }

  const handleClose = () => {
    if (isDirty) {
      modal.confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to close?',
        onConfirm: () => modal.closeAll(),
      })
    }
    else {
      modal.closeAll()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Name" />
      <input {...register('email')} placeholder="Email" />

      <div className="modal-actions">
        <button type="button" onClick={handleClose}>
          Cancel
        </button>
        <button type="submit">
          Save
        </button>
      </div>
    </form>
  )
}
```

### With State Management

```tsx
import { useModal } from '@/components/modals/modal-manager'
import { useAppDispatch } from '@/store'
import { deleteUser } from '@/store/userSlice'

function UserList({ users }) {
  const modal = useModal()
  const dispatch = useAppDispatch()

  const handleDeleteUser = (user) => {
    modal.confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.name}?`,
      onConfirm: async () => {
        await dispatch(deleteUser(user.id)).unwrap()
        modal.alert({
          title: 'Success',
          message: 'User deleted successfully.',
        })
      },
    })
  }

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <span>{user.name}</span>
          <button onClick={() => handleDeleteUser(user)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Advanced Patterns

### Custom Modal Components

Create reusable modal components:

```tsx
function useCustomModal() {
  const modal = useModal()

  const showCustomModal = (data) => {
    return modal.show({
      title: 'Custom Modal',
      size: 'lg',
      content: <CustomModalContent data={data} />,
      actions: <CustomModalActions />,
    })
  }

  return { showCustomModal }
}
```

### Modal Composition

Compose modals with existing UI components:

```tsx
import { Card, Form } from '@/components/composition/ui-patterns'

function showFormModal(initialData) {
  return modal.show({
    title: 'Edit Settings',
    size: 'md',
    content: (
      <Card
        content={
          <Form
            title="User Settings"
            onSubmit={handleSubmit}
            actions={
              <>
                <Button variant="ghost">Cancel</Button>
                <Button type="submit">Save</Button>
              </>
            }
          >
            {/* Form fields */}
          </Form>
        }
      />
    ),
  })
}
```

### Modal Middleware

Add middleware for common modal behaviors:

```tsx
function useModalWithLogging() {
  const modal = useModal()

  const showWithLogging = (config) => {
    console.log('Modal opened:', config.title)

    return modal.show({
      ...config,
      onClose: () => {
        console.log('Modal closed:', config.title)
        config.onClose?.()
      },
    })
  }

  return { show: showWithLogging }
}
```

## Performance Considerations

1. **Portal Rendering**: Modals render outside the component tree to avoid style conflicts
2. **Lazy Loading**: Modal content can be lazy-loaded for better performance
3. **Memory Management**: Closed modals are properly cleaned up
4. **Event Listeners**: Global event listeners are added/removed efficiently

## Best Practices

### 1. Use Appropriate Modal Types

```tsx
// ✅ Good - Use confirmation for destructive actions
confirmDelete({ itemName: 'file.txt', onConfirm: deleteFile })

// ❌ Avoid - Generic modal for simple confirmations
modal.show({ title: 'Delete?', content: 'Are you sure?' })
```

### 2. Handle Loading States

```tsx
// ✅ Good - Show loading during async operations
const modalId = modal.show({
  title: 'Saving...',
  loading: true,
  content: 'Please wait...',
})

try {
  await saveData()
  modal.update(modalId, {
    title: 'Success!',
    loading: false,
    content: 'Data saved successfully.'
  })
}
catch (error) {
  modal.update(modalId, {
    title: 'Error',
    loading: false,
    error
  })
}
```

### 3. Provide Clear Actions

```tsx
// ✅ Good - Clear, descriptive action buttons
actions: (
  <>
    <Button variant="ghost" onClick={onCancel}>
      Keep Editing
    </Button>
    <Button variant="destructive" onClick={onDiscard}>
      Discard Changes
    </Button>
  </>
)

// ❌ Avoid - Unclear button labels
actions: (
  <>
    <Button onClick={onCancel}>No</Button>
    <Button onClick={onConfirm}>Yes</Button>
  </>
)
```

### 4. Handle Errors Gracefully

```tsx
// ✅ Good - Proper error handling in modals
const { showErrorReport } = useErrorReportModal()

try {
  await dangerousOperation()
}
catch (error) {
  showErrorReport(error, 'Operation context')
}
```

## Migration Guide

### From Basic Modals

```tsx
// Before - Basic modal state management
const [isModalOpen, setIsModalOpen] = useState(false)
const [modalContent, setModalContent] = useState(null)

// After - Unified modal system
const modal = useModal()
modal.show({ title: 'Modal', content: <div>Content</div> })
```

### From Confirmation Dialogs

```tsx
// Before - Custom confirmation dialog
const [showConfirm, setShowConfirm] = useState(false)

// After - Specialized confirmation modal
const { confirmDelete } = useConfirmationModals()
confirmDelete({ itemName: 'file', onConfirm: handleDelete })
```

This unified modal system provides a comprehensive solution for all modal/dialog needs in your application, with consistent behavior, accessibility, and developer experience.