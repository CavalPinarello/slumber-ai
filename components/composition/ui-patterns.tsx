// Common UI composition patterns for consistent component design

import React from 'react'
import { createComposedComponent, useComposedState } from './component-composer'
import cn from '@/utils/classnames'

/**
 * Standard card component pattern
 */
export type CardProps = {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  content: React.ReactNode
  actions?: React.ReactNode
  footer?: React.ReactNode
  loading?: boolean
  error?: Error | null
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const BaseCard: React.FC<CardProps> = ({
  title,
  subtitle,
  content,
  actions,
  footer,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const variantClasses = {
    default: 'bg-background-default border border-divider-subtle',
    outlined: 'bg-transparent border-2 border-divider-strong',
    elevated: 'bg-background-default shadow-lg border border-divider-subtle',
    filled: 'bg-background-secondary border border-divider-subtle',
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div className={cn(
      'rounded-lg',
      variantClasses[variant],
      sizeClasses[size],
      className,
    )}>
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-text-secondary mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2 ml-4">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className="text-text-primary">
        {content}
      </div>

      {footer && (
        <div className="mt-4 pt-4 border-t border-divider-subtle">
          {footer}
        </div>
      )}
    </div>
  )
}

export const Card = createComposedComponent(BaseCard, {
  withLoading: true,
  withErrorBoundary: true,
  withAccessibility: {
    role: 'region',
  },
})

/**
 * List component pattern with composition
 */
export type ListProps<T> = {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor?: (item: T, index: number) => string | number
  emptyState?: React.ReactNode
  loading?: boolean
  error?: Error | null
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  itemClassName?: string
  dividers?: boolean
}

function BaseList<T>({
  items,
  renderItem,
  keyExtractor = (_, index) => index,
  emptyState,
  header,
  footer,
  className,
  itemClassName,
  dividers = true,
}: ListProps<T>) {
  if (items.length === 0 && emptyState)
    return <div className="text-center py-8 text-text-secondary">{emptyState}</div>

  return (
    <div className={cn('space-y-0', className)}>
      {header && <div className="mb-4">{header}</div>}

      <div className={cn(dividers && 'divide-y divide-divider-subtle')}>
        {items.map((item, index) => (
          <div
            key={keyExtractor(item, index)}
            className={cn(
              dividers && index > 0 && 'pt-4',
              dividers && index < items.length - 1 && 'pb-4',
              itemClassName,
            )}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}

export const List = createComposedComponent(BaseList, {
  withLoading: { variant: 'skeleton' },
  withErrorBoundary: true,
}) as <T>(props: ListProps<T>) => JSX.Element

/**
 * Form pattern with composition
 */
export type FormProps = {
  title?: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
  loading?: boolean
  error?: Error | null
  className?: string
}

const BaseForm: React.FC<FormProps> = ({
  title,
  description,
  children,
  actions,
  onSubmit,
  className,
}) => {
  const { isDisabled } = useComposedState({})

  return (
    <form
      onSubmit={onSubmit}
      className={cn('space-y-6', className)}
    >
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-xl font-semibold text-text-primary">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-text-secondary">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {children}
      </div>

      {actions && (
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-divider-subtle">
          {actions}
        </div>
      )}
    </form>
  )
}

export const Form = createComposedComponent(BaseForm, {
  withLoading: true,
  withErrorBoundary: true,
  withAccessibility: {
    role: 'form',
  },
})

/**
 * Modal/Dialog pattern with composition
 */
export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  loading?: boolean
  error?: Error | null
}

const BaseModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md',
}) => {
  const { isDisabled } = useComposedState({})

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDisabled)
        onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, isDisabled])

  if (!isOpen)
    return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full m-4',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={!isDisabled ? onClose : undefined}
      />

      {/* Modal */}
      <div className={cn(
        'relative bg-background-default rounded-lg shadow-xl border border-divider-subtle',
        'w-full mx-4',
        sizeClasses[size],
      )}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-divider-subtle">
            <h2 className="text-xl font-semibold text-text-primary">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isDisabled}
              className="text-text-tertiary hover:text-text-primary disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-divider-subtle">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export const Modal = createComposedComponent(BaseModal, {
  withLoading: true,
  withErrorBoundary: true,
  withAccessibility: {
    role: 'dialog',
    ariaLabel: 'Modal dialog',
  },
})

/**
 * Data table pattern with composition
 */
export type Column<T> = {
  key: keyof T | string
  title: string
  render?: (value: any, item: T, index: number) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}

export type TableProps<T> = {
  data: T[]
  columns: Column<T>[]
  keyExtractor?: (item: T, index: number) => string | number
  emptyState?: React.ReactNode
  loading?: boolean
  error?: Error | null
  onRowClick?: (item: T, index: number) => void
  className?: string
}

function BaseTable<T>({
  data,
  columns,
  keyExtractor = (_, index) => index,
  emptyState,
  onRowClick,
  className,
}: TableProps<T>) {
  if (data.length === 0 && emptyState) {
    return (
      <div className="text-center py-12 text-text-secondary">
        {emptyState}
      </div>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-divider-subtle">
            {columns.map(column => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-4 py-3 text-left text-sm font-medium text-text-secondary',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                )}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-divider-subtle">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              className={cn(
                'hover:bg-background-secondary transition-colors',
                onRowClick && 'cursor-pointer',
              )}
              onClick={() => onRowClick?.(item, index)}
            >
              {columns.map((column) => {
                const value = typeof column.key === 'string' && column.key in (item as any)
                  ? (item as any)[column.key]
                  : undefined

                return (
                  <td
                    key={String(column.key)}
                    className={cn(
                      'px-4 py-3 text-sm text-text-primary',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                    )}
                  >
                    {column.render ? column.render(value, item, index) : String(value || '')}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const Table = createComposedComponent(BaseTable, {
  withLoading: { variant: 'skeleton' },
  withErrorBoundary: true,
}) as <T>(props: TableProps<T>) => JSX.Element

/**
 * Tabs pattern with composition
 */
export type Tab = {
  key: string
  label: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}

export type TabsProps = {
  tabs: Tab[]
  activeTab?: string
  onTabChange?: (tabKey: string) => void
  className?: string
  loading?: boolean
  error?: Error | null
}

const BaseTabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  const [internalActiveTab, setInternalActiveTab] = React.useState(tabs[0]?.key || '')
  const currentTab = activeTab || internalActiveTab

  const handleTabChange = (tabKey: string) => {
    if (onTabChange)
      onTabChange(tabKey)
    else
      setInternalActiveTab(tabKey)
  }

  const activeTabContent = tabs.find(tab => tab.key === currentTab)?.content

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="border-b border-divider-subtle">
        <nav className="flex space-x-8" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={currentTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              disabled={tab.disabled}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                currentTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-divider-strong',
                tab.disabled && 'opacity-50 cursor-not-allowed',
              )}
              onClick={() => !tab.disabled && handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${currentTab}`}
        aria-labelledby={`tab-${currentTab}`}
        className="py-4"
      >
        {activeTabContent}
      </div>
    </div>
  )
}

export const Tabs = createComposedComponent(BaseTabs, {
  withLoading: true,
  withErrorBoundary: true,
  withAccessibility: {
    role: 'tablist',
  },
})

export default {
  Card,
  List,
  Form,
  Modal,
  Table,
  Tabs,
}
