# Component Composition System

A comprehensive composition system for building reusable, accessible, and maintainable React components with dependency injection, HOC patterns, and standardized UI components.

## Architecture Overview

### Core Files

1. **`component-composer.tsx`** - Core composition utilities and HOCs
2. **`ui-patterns.tsx`** - Pre-built composed UI components
3. **`composition-examples.tsx`** - Usage examples and patterns
4. **`README.md`** - This documentation

### Key Features

- **Higher-Order Components (HOCs)**: Composable functionality like loading, error handling, accessibility
- **Dependency Injection**: Context-based dependency injection for component composition
- **Slot System**: Flexible content composition with named slots
- **Template System**: Consistent layout templates for common UI patterns
- **Type Safety**: Full TypeScript support with proper type inference
- **Accessibility**: Built-in accessibility features and ARIA attributes

## Quick Start

### Basic Composed Components

Use pre-built composed components for common UI patterns:

```tsx
import { Card, Form, List, Modal, Table, Tabs } from '@/components/composition/ui-patterns'

function MyComponent() {
  return (
    <Card
      title="User Profile"
      subtitle="Manage your account settings"
      loading={isLoading}
      error={error}
      content={
        <Form
          title="Personal Information"
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
      actions={
        <Button size="small">Edit</Button>
      }
    />
  )
}
```

### Custom Component Composition

Create your own composed components using HOCs:

```tsx
import { createComposedComponent, withLoading, withErrorBoundary } from '@/components/composition/component-composer'

const MyComponent = ({ title, children }) => (
  <div className="p-4">
    <h2>{title}</h2>
    {children}
  </div>
)

// Automatically add loading and error handling
const EnhancedComponent = createComposedComponent(MyComponent, {
  withLoading: true,
  withErrorBoundary: true,
  withAccessibility: { role: 'region' },
})

// Usage
<EnhancedComponent
  title="Enhanced Component"
  loading={isLoading}
  error={error}
>
  Content here
</EnhancedComponent>
```

## Available Components

### Card

Flexible card component with title, subtitle, content, actions, and footer:

```tsx
<Card
  title="Card Title"
  subtitle="Optional subtitle"
  variant="outlined" // 'default' | 'outlined' | 'elevated' | 'filled'
  size="md" // 'sm' | 'md' | 'lg'
  loading={isLoading}
  error={error}
  content={<div>Card content here</div>}
  actions={<Button size="small">Action</Button>}
  footer={<div>Footer content</div>}
/>
```

### List

Generic list component with customizable item rendering:

```tsx
<List
  items={data}
  loading={isLoading}
  error={error}
  keyExtractor={item => item.id}
  renderItem={(item, index) => (
    <div>
      <h4>{item.title}</h4>
      <p>{item.description}</p>
    </div>
  )}
  emptyState={<div>No items found</div>}
  header={<h3>Item List</h3>}
  footer={<Button>Load More</Button>}
  dividers={true}
/>
```

### Form

Composed form component with title, description, and actions:

```tsx
<Form
  title="Contact Form"
  description="Send us a message"
  loading={isSubmitting}
  error={submitError}
  onSubmit={handleSubmit}
  actions={
    <>
      <Button variant="ghost">Cancel</Button>
      <Button type="submit">Submit</Button>
    </>
  }
>
  {/* Form fields */}
  <input type="text" placeholder="Name" />
  <textarea placeholder="Message" />
</Form>
```

### Modal

Accessible modal component with backdrop and keyboard navigation:

```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Modal Title"
  size="md" // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  loading={isLoading}
  error={error}
  actions={
    <>
      <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>Save</Button>
    </>
  }
>
  <div>Modal content here</div>
</Modal>
```

### Table

Data table component with sorting, custom rendering, and row interactions:

```tsx
<Table
  data={users}
  loading={isLoading}
  error={error}
  keyExtractor={user => user.id}
  onRowClick={user => console.log('Clicked:', user)}
  columns={[
    {
      key: 'name',
      title: 'Name',
      width: '200px',
    },
    {
      key: 'email',
      title: 'Email',
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center',
      render: value => (
        <span className={`badge ${value.toLowerCase()}`}>
          {value}
        </span>
      ),
    },
  ]}
  emptyState={<div>No users found</div>}
/>
```

### Tabs

Tabbed interface component with keyboard navigation:

```tsx
<Tabs
  tabs={[
    {
      key: 'overview',
      label: 'Overview',
      content: <div>Overview content</div>,
    },
    {
      key: 'settings',
      label: 'Settings',
      content: <div>Settings content</div>,
      disabled: !hasPermission,
    },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  loading={isLoading}
  error={error}
/>
```

## Higher-Order Components (HOCs)

### withLoading

Add loading states to any component:

```tsx
const LoadingButton = withLoading(Button, {
  variant: 'spinner',
  size: 'sm',
  text: 'Loading...',
})

<LoadingButton isLoading={isSubmitting}>
  Submit
</LoadingButton>
```

### withErrorBoundary

Add error boundary protection:

```tsx
const SafeComponent = withErrorBoundary(MyComponent, {
  variant: 'component',
  onError: (error, errorInfo) => {
    console.error('Component error:', error, errorInfo)
  },
})
```

### withAccessibility

Add accessibility features:

```tsx
const AccessibleButton = withAccessibility(Button, {
  role: 'button',
  ariaLabel: 'Save document',
  focusable: true,
})
```

### withConditional

Conditional rendering based on props and context:

```tsx
const ConditionalComponent = withConditional(
  MyComponent,
  (props, context) => props.isVisible && !context.disabled,
  <div>Component is hidden</div>
)
```

### Composing Multiple HOCs

Use the `compose` utility to combine multiple HOCs:

```tsx
const EnhancedComponent = compose(
  withLoading,
  withErrorBoundary,
  withAccessibility,
  withComposition
)(MyComponent)
```

## Composition Context

### Context Provider

Provide composition context to child components:

```tsx
import { CompositionProvider } from '@/components/composition/component-composer'

<CompositionProvider
  value={{
    theme: 'dark',
    size: 'lg',
    variant: 'outlined',
    disabled: isDisabled,
    loading: isLoading,
  }}
>
  {/* Child components inherit context */}
  <MyComponent />
</CompositionProvider>
```

### Using Context

Access composition context in your components:

```tsx
import { useCompositionContext } from '@/components/composition/component-composer'

function MyComponent() {
  const { theme, size, disabled, loading } = useCompositionContext()

  return (
    <div className={`component-${theme} size-${size} ${disabled ? 'disabled' : ''}`}>
      {loading ? 'Loading...' : 'Ready'}
    </div>
  )
}
```

### Composed State Hook

Manage component state with composition context awareness:

```tsx
import { useComposedState } from '@/components/composition/component-composer'

function MyComponent() {
  const { state, setState, isDisabled, isLoading, context } = useComposedState({
    count: 0,
  })

  return (
    <div>
      <span>Count: {state.count}</span>
      <button
        disabled={isDisabled}
        onClick={() => setState(prev => ({ count: prev.count + 1 }))}
      >
        {isLoading ? 'Loading...' : 'Increment'}
      </button>
    </div>
  )
}
```

## Slot System

### Basic Slot Usage

Create flexible content composition with named slots:

```tsx
import { SlotProvider, useSlot } from '@/components/composition/component-composer'

function Layout() {
  const header = useSlot('header')
  const content = useSlot('content')
  const footer = useSlot('footer')

  return (
    <div>
      <header>{header}</header>
      <main>{content}</main>
      <footer>{footer}</footer>
    </div>
  )
}

// Usage
<SlotProvider
  slots={{
    header: <h1>Page Title</h1>,
    content: <div>Main content</div>,
    footer: <div>Footer content</div>,
  }}
>
  <Layout />
</SlotProvider>
```

### Conditional Slots

Use conditional slots for optional content:

```tsx
import { Slot } from '@/components/composition/component-composer'

function MyComponent({ showHeader, headerContent, children }) {
  return (
    <div>
      <Slot condition={showHeader} fallback={<div>No header</div>}>
        {headerContent}
      </Slot>
      <main>{children}</main>
    </div>
  )
}
```

## Component Templates

### Layout Templates

Use predefined templates for consistent layouts:

```tsx
import { ComponentTemplate } from '@/components/composition/component-composer'

<ComponentTemplate
  layout="sidebar" // 'default' | 'sidebar' | 'split' | 'centered'
  loading={isLoading}
  error={error}
  header={<h1>Dashboard</h1>}
  sidebar={
    <nav>
      <a href="/dashboard">Dashboard</a>
      <a href="/settings">Settings</a>
    </nav>
  }
  content={
    <div>
      <Card title="Main Content" content="Dashboard content here" />
    </div>
  }
  actions={
    <>
      <Button variant="ghost">Export</Button>
      <Button>Save</Button>
    </>
  }
  footer={<div>© 2024 Your App</div>}
/>
```

## Best Practices

### 1. Use Composed Components for Common Patterns

```tsx
// ✅ Good - Use pre-built composed components
import { Card, Form, Table } from '@/components/composition/ui-patterns'

// ❌ Avoid - Building common patterns from scratch every time
```

### 2. Leverage HOCs for Cross-Cutting Concerns

```tsx
// ✅ Good - Use HOCs for shared functionality
const EnhancedComponent = createComposedComponent(MyComponent, {
  withLoading: true,
  withErrorBoundary: true,
})

// ❌ Avoid - Manual implementation of common functionality
```

### 3. Use Composition Context for Shared State

```tsx
// ✅ Good - Use composition context for theme, size, etc.
<CompositionProvider value={{ theme: 'dark', size: 'lg' }}>
  <MyComponents />
</CompositionProvider>

// ❌ Avoid - Prop drilling for shared styling concerns
```

### 4. Implement Accessibility by Default

```tsx
// ✅ Good - Use accessibility HOCs
const AccessibleButton = withAccessibility(Button, {
  role: 'button',
  ariaLabel: 'Save document',
})

// ✅ Good - Use composed components with built-in accessibility
<Modal title="Settings" isOpen={isOpen} onClose={onClose}>
  {/* Modal handles focus management, escape key, etc. */}
</Modal>
```

### 5. Handle Loading and Error States Consistently

```tsx
// ✅ Good - Consistent loading and error handling
<Card
  title="User Data"
  loading={isLoading}
  error={error}
  content={<UserProfile />}
/>

// ❌ Avoid - Inconsistent loading/error patterns across components
```

## Integration with Existing Systems

### With React Query

Compose components work seamlessly with React Query:

```tsx
import { useQuery } from '@tanstack/react-query'
import { Card, List } from '@/components/composition/ui-patterns'

function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  return (
    <Card
      title="Users"
      loading={isLoading}
      error={error}
      content={
        <List
          items={data || []}
          renderItem={user => <UserCard user={user} />}
          emptyState="No users found"
        />
      }
    />
  )
}
```

### With Form Libraries

Integrate with form libraries like React Hook Form:

```tsx
import { useForm } from 'react-hook-form'
import { Form } from '@/components/composition/ui-patterns'

function ContactForm() {
  const { handleSubmit, register, formState: { isSubmitting, errors } } = useForm()

  return (
    <Form
      title="Contact Us"
      onSubmit={handleSubmit(onSubmit)}
      loading={isSubmitting}
      error={errors.root}
      actions={
        <Button type="submit" disabled={isSubmitting}>
          Send Message
        </Button>
      }
    >
      <input {...register('name', { required: true })} placeholder="Name" />
      <input {...register('email', { required: true })} placeholder="Email" />
      <textarea {...register('message', { required: true })} placeholder="Message" />
    </Form>
  )
}
```

## Performance Considerations

1. **Memoization**: Composed components use React.forwardRef and proper memoization
2. **Lazy Loading**: Use React.lazy with composed components for code splitting
3. **Context Optimization**: Composition context is optimized to minimize re-renders
4. **HOC Composition**: HOCs are composed efficiently without unnecessary wrapper components

## Migration Guide

### From Basic Components

```tsx
// Before - Basic component
// After - Composed component
import { Card } from '@/components/composition/ui-patterns'

function UserCard({ user, isLoading }) {
  if (isLoading)
    return <div>Loading...</div>

  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )
}

function UserCard({ user, isLoading }) {
  return (
    <Card
      loading={isLoading}
      title={user?.name}
      content={<p>{user?.email}</p>}
    />
  )
}
```

### From Manual HOCs

```tsx
// Before - Manual HOC implementation
// After - Use composition system
import { createComposedComponent } from '@/components/composition/component-composer'

const withLoading = Component => (props) => {
  if (props.isLoading)
    return <div>Loading...</div>
  return <Component {...props} />
}

const EnhancedComponent = createComposedComponent(Component, {
  withLoading: true,
})
```

This composition system provides a robust foundation for building consistent, accessible, and maintainable UI components while promoting code reuse and standardization across your application.