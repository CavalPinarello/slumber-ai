# Optimistic Updates System

This directory contains a comprehensive optimistic updates system built on top of React Query, designed to provide instant UI feedback while maintaining data consistency and error handling.

## Architecture Overview

### Core Files

1. **`optimistic-updates.ts`** - Core optimistic update functions and utilities
2. **`mutation-patterns.ts`** - Enhanced mutations with automatic optimistic updates
3. **`query-invalidation.ts`** - Smart query invalidation patterns
4. **`error-handler.ts`** - Centralized error handling
5. **`optimistic-examples.tsx`** - Usage examples and patterns

### Key Features

- **Automatic Rollback**: Failed operations automatically revert optimistic changes
- **Temporary IDs**: Seamless handling of temporary entities before server confirmation
- **Smart Invalidation**: Intelligent cache invalidation based on data relationships
- **Error Recovery**: Graceful error handling with user feedback
- **Type Safety**: Full TypeScript support with proper type inference

## Quick Start

### Basic Usage (Recommended)

Use the enhanced mutations from `mutation-patterns.ts` for automatic optimistic updates:

```tsx
import { useConversationMutations } from '@/service/mutation-patterns'

function ConversationList({ appId }: { appId: string }) {
  const { createConversation, deleteConversation } = useConversationMutations()

  const handleCreate = async () => {
    try {
      // Conversation appears instantly, rolls back on error
      await createConversation.mutateAsync({
        appId,
        name: 'New Conversation',
      })
    }
    catch (error) {
      // Error handled automatically, UI already rolled back
      console.error('Creation failed:', error)
    }
  }

  const handleDelete = async (conversationId: string) => {
    try {
      // Conversation disappears instantly, restored on error
      await deleteConversation.mutateAsync({
        id: conversationId,
        appId,
      })
    }
    catch (error) {
      console.error('Deletion failed:', error)
    }
  }

  return (
    <div>
      <button onClick={handleCreate}>Create Conversation</button>
      {/* Render conversations */}
    </div>
  )
}
```

### Advanced Usage

For custom optimistic logic, use the `useOptimisticUpdates` hook directly:

```tsx
import { useOptimisticUpdates } from '@/service/optimistic-updates'

function AdvancedComponent({ appId }: { appId: string }) {
  const { optimisticallyCreateConversation, replaceTemporaryConversation } = useOptimisticUpdates()

  const handleCustomCreate = async () => {
    // Apply optimistic update
    const { tempConversation, rollback } = optimisticallyCreateConversation(appId, {
      name: 'Custom Conversation',
    })

    try {
      // Your custom API call
      const response = await customApiCall()

      // Replace temporary with real data
      replaceTemporaryConversation(appId, tempConversation.id, response)
    }
    catch (error) {
      // Rollback on error
      rollback()
    }
  }

  return <button onClick={handleCustomCreate}>Custom Create</button>
}
```

## Available Mutations

### Conversation Operations

```tsx
const {
  createConversation, // Create with optimistic add
  updateConversation, // Update with optimistic edit
  deleteConversation, // Delete with optimistic remove
  pinConversation, // Pin with optimistic toggle
  unpinConversation, // Unpin with optimistic toggle
} = useConversationMutations()
```

### Message Operations

```tsx
const {
  sendMessage, // Send with optimistic add
  updateMessageFeedback, // Update feedback optimistically
  regenerateMessage, // Regenerate with loading indicator
} = useMessageMutations()
```

### Batch Operations

```tsx
const {
  batchDeleteConversations, // Batch delete with optimistic remove
} = useBatchMutations()
```

## Error Handling

All mutations include automatic error handling:

1. **Optimistic Updates**: Applied immediately for instant feedback
2. **API Call**: Actual server request in background
3. **Success**: Server data replaces optimistic data
4. **Error**: Optimistic changes rolled back, error displayed

```tsx
// Error handling is automatic
const { createConversation } = useConversationMutations()

// This handles all error scenarios automatically
await createConversation.mutateAsync({ appId, name: 'New Chat' })
```

## Loading States

Use React Query's built-in loading states or custom loading indicators:

```tsx
const { createConversation } = useConversationMutations()

return (
  <button
    disabled={createConversation.isPending}
    onClick={() => createConversation.mutate({ appId, name: 'New Chat' })}
  >
    {createConversation.isPending ? 'Creating...' : 'Create Conversation'}
  </button>
)
```

## Integration with Components

### Error Boundaries

Wrap components with query error boundaries for better error handling:

```tsx
import { QueryErrorBoundary } from '@/components/error-boundaries/query-error-boundary'

function App() {
  return (
    <QueryErrorBoundary variant="component">
      <ConversationList appId={appId} />
    </QueryErrorBoundary>
  )
}
```

### Loading Components

Use unified loading components for consistent UX:

```tsx
import { UnifiedLoading } from '@/components/loading/unified-loading'

function LoadingButton({ isLoading, children, ...props }) {
  return (
    <button disabled={isLoading} {...props}>
      {isLoading
        ? (
          <UnifiedLoading variant="spinner" size="sm" position="inline" />
        )
        : (
          children
        )}
    </button>
  )
}
```

## Best Practices

### 1. Use Standard Mutations for Common Operations

```tsx
// ✅ Good - Uses standard mutation with automatic optimistic updates
const { createConversation } = useConversationMutations()
await createConversation.mutateAsync(data)

// ❌ Avoid - Manual optimistic updates for common operations
const { optimisticallyCreateConversation } = useOptimisticUpdates()
```

### 2. Handle Errors Gracefully

```tsx
// ✅ Good - Let mutations handle errors automatically
try {
  await createConversation.mutateAsync(data)
  // Success handling
}
catch (error) {
  // Additional error handling if needed
}

// ❌ Avoid - Manual error rollback (unless custom logic needed)
```

### 3. Use Loading States Appropriately

```tsx
// ✅ Good - Use React Query's loading states
const { createConversation } = useConversationMutations()
const isLoading = createConversation.isPending

// ✅ Good - Combine with custom loading states for complex UX
const [customLoading, setCustomLoading] = useState(false)
```

### 4. Leverage Error Boundaries

```tsx
// ✅ Good - Use error boundaries for component-level error handling
<QueryErrorBoundary variant="component">
  <ConversationComponent />
</QueryErrorBoundary>

// ✅ Good - Use different variants for different contexts
<QueryErrorBoundary variant="page">
  <AppLayout />
</QueryErrorBoundary>
```

## Troubleshooting

### Common Issues

1. **Optimistic Update Not Showing**
   - Check if the query key matches the cache key
   - Ensure the component is subscribed to the correct query

2. **Rollback Not Working**
   - Verify error handling in mutation configuration
   - Check if rollback function is called in error handler

3. **Data Inconsistency**
   - Use proper query invalidation after mutations
   - Ensure temporary IDs are replaced with real IDs

### Debug Tools

Use React Query DevTools to inspect cache state and mutations:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

## Performance Considerations

1. **Batch Updates**: Use batch mutations for multiple operations
2. **Smart Invalidation**: Leverage smart invalidation to avoid unnecessary refetches
3. **Optimistic Limits**: Don't overuse optimistic updates for non-critical operations
4. **Memory Management**: Temporary entities are cleaned up automatically

## Migration Guide

### From Manual State Management

```tsx
// Before - Manual state management
const [conversations, setConversations] = useState([])
const [loading, setLoading] = useState(false)

const createConversation = async (data) => {
  setLoading(true)
  try {
    const response = await api.createConversation(data)
    setConversations(prev => [response, ...prev])
  }
  catch (error) {
    // Manual error handling
  }
  finally {
    setLoading(false)
  }
}

// After - Optimistic mutations
const { createConversation } = useConversationMutations()

const handleCreate = () => {
  createConversation.mutate(data) // Automatic optimistic updates and error handling
}
```

### From Basic React Query

```tsx
// Before - Basic React Query
const createMutation = useMutation({
  mutationFn: createConversation,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] })
  }
})

// After - Enhanced mutations
const { createConversation } = useConversationMutations()
// Automatic optimistic updates, error handling, and invalidation
```

This optimistic updates system provides a robust foundation for building responsive, user-friendly interfaces while maintaining data consistency and proper error handling.