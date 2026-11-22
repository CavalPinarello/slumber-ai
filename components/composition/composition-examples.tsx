// Examples and usage patterns for component composition system

import React from 'react'
import { Card, Form, List, Modal, Table, Tabs } from './ui-patterns'
import {
  ComponentTemplate, 
  SlotProvider, 
  compose, 
  useComposedState, 
  useSlot,
  withComposition,
  withErrorBoundary,
  withLoading,
} from './component-composer'
import Button from '@/app/components/base/button'

/**
 * Example: Basic Card usage
 */
export const CardExample: React.FC = () => {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const handleAction = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setError(null)
    }
 catch (err) {
      setError(err as Error)
    }
 finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Basic Card */}
      <Card
        title="Basic Card"
        subtitle="Simple card with content"
        content={
          <p>This is the card content. It can contain any React elements.</p>
        }
        actions={
          <Button size="small" variant="ghost">
            Action
          </Button>
        }
      />

      {/* Card with Loading State */}
      <Card
        title="Loading Card"
        subtitle="Card with loading functionality"
        loading={loading}
        error={error}
        content={
          <div>
            <p>This card demonstrates loading states.</p>
            <Button onClick={handleAction} disabled={loading}>
              {loading ? 'Loading...' : 'Trigger Loading'}
            </Button>
          </div>
        }
        variant="outlined"
      />

      {/* Elevated Card */}
      <Card
        title="Elevated Card"
        content="This card has elevation and shadow effects."
        variant="elevated"
        size="lg"
        footer={
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-tertiary">Footer content</span>
            <Button size="small">Footer Action</Button>
          </div>
        }
      />
    </div>
  )
}

/**
 * Example: List with composition
 */
export const ListExample: React.FC = () => {
  const [items, setItems] = React.useState([
    { id: 1, name: 'Item 1', description: 'First item' },
    { id: 2, name: 'Item 2', description: 'Second item' },
    { id: 3, name: 'Item 3', description: 'Third item' },
  ])

  const [loading, setLoading] = React.useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
  }

  return (
    <Card
      title="List Example"
      actions={
        <Button size="small" onClick={handleRefresh} disabled={loading}>
          Refresh
        </Button>
      }
      content={
        <List
          items={items}
          loading={loading}
          keyExtractor={item => item.id}
          renderItem={item => (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-text-secondary">{item.description}</p>
              </div>
              <Button size="small" variant="ghost">
                Edit
              </Button>
            </div>
          )}
          emptyState={
            <div className="text-center">
              <p>No items found</p>
              <Button size="small" className="mt-2">
                Add Item
              </Button>
            </div>
          }
        />
      }
    />
  )
}

/**
 * Example: Form with composition
 */
export const FormExample: React.FC = () => {
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
    console.log('Form submitted:', formData)
  }

  return (
    <Form
      title="Contact Form"
      description="Send us a message and we'll get back to you."
      onSubmit={handleSubmit}
      loading={loading}
      actions={
        <>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </>
      }
    >
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-divider-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full px-3 py-2 border border-divider-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Message
        </label>
        <textarea
          value={formData.message}
          onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-divider-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Your message..."
        />
      </div>
    </Form>
  )
}

/**
 * Example: Modal with composition
 */
export const ModalExample: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleSave = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    setIsOpen(false)
  }

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Modal"
        loading={loading}
        size="md"
        actions={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p>This is a modal dialog with composition features.</p>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Input Field
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-divider-subtle rounded-md"
              placeholder="Enter some text..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

/**
 * Example: Table with composition
 */
export const TableExample: React.FC = () => {
  const [data, setData] = React.useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
  ])

  const [loading, setLoading] = React.useState(false)

  const columns = [
    {
      key: 'name' as const,
      title: 'Name',
      width: '200px',
    },
    {
      key: 'email' as const,
      title: 'Email',
    },
    {
      key: 'role' as const,
      title: 'Role',
      width: '100px',
      align: 'center' as const,
    },
    {
      key: 'status' as const,
      title: 'Status',
      width: '120px',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'actions' as const,
      title: 'Actions',
      width: '120px',
      align: 'right' as const,
      render: (_: any, item: any) => (
        <Button size="small" variant="ghost">
          Edit
        </Button>
      ),
    },
  ]

  const handleRefresh = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
  }

  return (
    <Card
      title="Users Table"
      actions={
        <Button size="small" onClick={handleRefresh} disabled={loading}>
          Refresh
        </Button>
      }
      content={
        <Table
          data={data}
          columns={columns}
          loading={loading}
          keyExtractor={item => item.id}
          onRowClick={item => console.log('Clicked:', item)}
          emptyState={
            <div>
              <p>No users found</p>
              <Button size="small" className="mt-2">
                Add User
              </Button>
            </div>
          }
        />
      }
    />
  )
}

/**
 * Example: Tabs with composition
 */
export const TabsExample: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('overview')

  const tabs = [
    {
      key: 'overview',
      label: 'Overview',
      content: (
        <Card
          content={
            <div>
              <h4 className="font-medium mb-2">Overview Content</h4>
              <p>This is the overview tab content with some information.</p>
            </div>
          }
        />
      ),
    },
    {
      key: 'settings',
      label: 'Settings',
      content: (
        <Card
          content={
            <div>
              <h4 className="font-medium mb-4">Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Enable notifications</span>
                  <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-save</span>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>
            </div>
          }
        />
      ),
    },
    {
      key: 'help',
      label: 'Help',
      content: (
        <Card
          content={
            <div>
              <h4 className="font-medium mb-2">Help & Support</h4>
              <p>Contact us for support or check out our documentation.</p>
              <Button size="small" className="mt-3">
                Contact Support
              </Button>
            </div>
          }
        />
      ),
    },
  ]

  return (
    <Card
      title="Tabs Example"
      content={
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      }
    />
  )
}

/**
 * Example: Custom composed component
 */
const CustomButton = React.forwardRef<HTMLButtonElement, {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}>(props, ref) => {
  const { children, ...buttonProps } = props
  return (
    <button
      ref={ref}
      className="px-4 py-2 rounded-md font-medium"
      {...buttonProps}
    >
      {children}
    </button>
  )
}

// Compose the button with multiple HOCs
const EnhancedButton = compose(
  withLoading,
  withErrorBoundary,
  withComposition,
)(CustomButton)

export const ComposedComponentExample: React.FC = () => {
  const [loading, setLoading] = React.useState(false)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Composed Components</h3>

      <EnhancedButton
        onClick={() => {
          setLoading(true)
          setTimeout(() => setLoading(false), 2000)
        }}
        isLoading={loading}
        compositionContext={{
          variant: 'primary',
          size: 'md',
        }}
      >
        Enhanced Button
      </EnhancedButton>
    </div>
  )
}

/**
 * Example: Slot system usage
 */
export const SlotExample: React.FC = () => {
  const HeaderSlot = () => {
    const headerContent = useSlot('header')
    return <div className="mb-4">{headerContent}</div>
  }

  const ContentSlot = () => {
    const contentSlot = useSlot('content')
    return <div className="flex-1">{contentSlot}</div>
  }

  const FooterSlot = () => {
    const footerContent = useSlot('footer')
    return footerContent ? <div className="mt-4">{footerContent}</div> : null
  }

  return (
    <SlotProvider
      slots={{
        header: <h2 className="text-xl font-semibold">Slot System Example</h2>,
        content: (
          <div>
            <p>This content is provided through the slot system.</p>
            <p>Slots allow for flexible content composition.</p>
          </div>
        ),
        footer: (
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" size="small">Cancel</Button>
            <Button size="small">Save</Button>
          </div>
        ),
      }}
    >
      <Card
        content={
          <div className="space-y-4">
            <HeaderSlot />
            <ContentSlot />
            <FooterSlot />
          </div>
        }
      />
    </SlotProvider>
  )
}

/**
 * Example: Component Template usage
 */
export const TemplateExample: React.FC = () => {
  const [loading, setLoading] = React.useState(false)

  return (
    <ComponentTemplate
      layout="sidebar"
      loading={loading}
      header={
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button size="small" onClick={() => setLoading(!loading)}>
            Toggle Loading
          </Button>
        </div>
      }
      sidebar={
        <div className="space-y-4">
          <h3 className="font-medium">Navigation</h3>
          <div className="space-y-2">
            <Button variant="ghost" size="small" className="w-full justify-start">
              Dashboard
            </Button>
            <Button variant="ghost" size="small" className="w-full justify-start">
              Analytics
            </Button>
            <Button variant="ghost" size="small" className="w-full justify-start">
              Settings
            </Button>
          </div>
        </div>
      }
      content={
        <div className="space-y-6">
          <Card
            title="Main Content"
            content="This is the main content area of the template."
          />
          <Card
            title="Another Section"
            content="Templates provide consistent layouts across your application."
          />
        </div>
      }
      actions={
        <>
          <Button variant="ghost" size="small">
            Export
          </Button>
          <Button size="small">
            Save
          </Button>
        </>
      }
      footer={
        <div className="text-center text-sm text-text-tertiary">
          © 2024 Your Application. All rights reserved.
        </div>
      }
    />
  )
}

export default {
  CardExample,
  ListExample,
  FormExample,
  ModalExample,
  TableExample,
  TabsExample,
  ComposedComponentExample,
  SlotExample,
  TemplateExample,
}
