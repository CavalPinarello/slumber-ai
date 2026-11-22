// Component composition utilities with dependency injection and HOC patterns

import React from 'react'
import { QueryErrorBoundary } from '@/components/error-boundaries/query-error-boundary'
import { UnifiedLoading } from '@/components/loading/unified-loading'

/**
 * Base composition context for dependency injection
 */
export interface CompositionContext {
  theme?: 'light' | 'dark'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'outlined' | 'filled' | 'ghost'
  disabled?: boolean
  loading?: boolean
  error?: Error | null
}

/**
 * Context provider for component composition
 */
const CompositionContext = React.createContext<CompositionContext>({})

export const useCompositionContext = () => React.useContext(CompositionContext)

export const CompositionProvider: React.FC<{
  children: React.ReactNode
  value: CompositionContext
}> = ({ children, value }) => (
  <CompositionContext.Provider value={value}>
    {children}
  </CompositionContext.Provider>
)

/**
 * Higher-order component for adding composition capabilities
 */
export const withComposition = <P extends object>(
  Component: React.ComponentType<P>,
  defaultContext: Partial<CompositionContext> = {}
) => {
  const ComposedComponent = React.forwardRef<any, P & { compositionContext?: CompositionContext }>((props, ref) => {
    const { compositionContext, ...componentProps } = props
    const parentContext = useCompositionContext()
    
    const mergedContext: CompositionContext = {
      ...defaultContext,
      ...parentContext,
      ...compositionContext,
    }

    return (
      <CompositionProvider value={mergedContext}>
        <Component {...(componentProps as P)} ref={ref} />
      </CompositionProvider>
    )
  })

  ComposedComponent.displayName = `withComposition(${Component.displayName || Component.name})`
  return ComposedComponent
}

/**
 * HOC for adding loading states
 */
export const withLoading = <P extends object>(
  Component: React.ComponentType<P>,
  loadingConfig?: {
    variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse' | 'shimmer'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    text?: string
  }
) => {
  return React.forwardRef<any, P & { isLoading?: boolean }>((props, ref) => {
    const { isLoading, ...componentProps } = props
    const context = useCompositionContext()

    if (isLoading || context.loading) {
      return (
        <UnifiedLoading
          variant={loadingConfig?.variant || 'spinner'}
          size={loadingConfig?.size || context.size || 'md'}
          text={loadingConfig?.text}
          position="center"
        />
      )
    }

    return <Component {...(componentProps as P)} ref={ref} />
  })
}

/**
 * HOC for adding error boundaries
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorConfig?: {
    variant?: 'page' | 'component' | 'inline'
    fallback?: React.ComponentType<any>
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  }
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const context = useCompositionContext()

    return (
      <QueryErrorBoundary
        variant={errorConfig?.variant || 'component'}
        fallback={errorConfig?.fallback}
        onError={errorConfig?.onError}
      >
        <Component {...props} ref={ref} />
      </QueryErrorBoundary>
    )
  })
}

/**
 * HOC for conditional rendering
 */
export const withConditional = <P extends object>(
  Component: React.ComponentType<P>,
  condition: (props: P, context: CompositionContext) => boolean,
  fallback?: React.ComponentType<P> | React.ReactNode
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const context = useCompositionContext()

    if (!condition(props, context)) {
      if (React.isValidElement(fallback)) {
        return fallback
      }
      if (typeof fallback === 'function') {
        const FallbackComponent = fallback as React.ComponentType<P>
        return <FallbackComponent {...props} ref={ref} />
      }
      return null
    }

    return <Component {...props} ref={ref} />
  })
}

/**
 * HOC for adding accessibility features
 */
export const withAccessibility = <P extends object>(
  Component: React.ComponentType<P>,
  a11yConfig?: {
    role?: string
    ariaLabel?: string
    ariaDescribedBy?: string
    tabIndex?: number
    focusable?: boolean
  }
) => {
  return React.forwardRef<any, P & { a11yProps?: Record<string, any> }>((props, ref) => {
    const { a11yProps, ...componentProps } = props
    const context = useCompositionContext()

    const accessibilityProps = {
      role: a11yConfig?.role,
      'aria-label': a11yConfig?.ariaLabel,
      'aria-describedby': a11yConfig?.ariaDescribedBy,
      tabIndex: context.disabled ? -1 : (a11yConfig?.tabIndex ?? 0),
      'aria-disabled': context.disabled,
      ...a11yProps,
    }

    // Filter out undefined values
    const cleanedA11yProps = Object.fromEntries(
      Object.entries(accessibilityProps).filter(([_, value]) => value !== undefined)
    )

    return (
      <Component
        {...(componentProps as P)}
        {...cleanedA11yProps}
        ref={ref}
      />
    )
  })
}

/**
 * Compose multiple HOCs together
 */
export const compose = <P extends object>(...hocs: Array<(component: React.ComponentType<any>) => React.ComponentType<any>>) => {
  return (Component: React.ComponentType<P>) => {
    return hocs.reduceRight((acc, hoc) => hoc(acc), Component)
  }
}

/**
 * Utility for creating composed components with common patterns
 */
export const createComposedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  config: {
    withLoading?: boolean | Parameters<typeof withLoading>[1]
    withErrorBoundary?: boolean | Parameters<typeof withErrorBoundary>[1]
    withAccessibility?: boolean | Parameters<typeof withAccessibility>[1]
    withConditional?: Parameters<typeof withConditional>[1]
    defaultContext?: Partial<CompositionContext>
  } = {}
) => {
  let composedComponent = Component

  // Apply composition context
  if (config.defaultContext) {
    composedComponent = withComposition(composedComponent, config.defaultContext)
  }

  // Apply conditional rendering
  if (config.withConditional) {
    composedComponent = withConditional(composedComponent, config.withConditional)
  }

  // Apply accessibility
  if (config.withAccessibility) {
    const a11yConfig = typeof config.withAccessibility === 'boolean' ? {} : config.withAccessibility
    composedComponent = withAccessibility(composedComponent, a11yConfig)
  }

  // Apply error boundary
  if (config.withErrorBoundary) {
    const errorConfig = typeof config.withErrorBoundary === 'boolean' ? {} : config.withErrorBoundary
    composedComponent = withErrorBoundary(composedComponent, errorConfig)
  }

  // Apply loading
  if (config.withLoading) {
    const loadingConfig = typeof config.withLoading === 'boolean' ? {} : config.withLoading
    composedComponent = withLoading(composedComponent, loadingConfig)
  }

  return composedComponent
}

/**
 * Hook for managing component state within composition context
 */
export const useComposedState = <T>(initialState: T) => {
  const context = useCompositionContext()
  const [state, setState] = React.useState<T>(initialState)

  const isDisabled = context.disabled || context.loading
  const isLoading = context.loading || false

  const safeSetState = React.useCallback((newState: T | ((prev: T) => T)) => {
    if (!isDisabled) {
      setState(newState)
    }
  }, [isDisabled])

  return {
    state,
    setState: safeSetState,
    isDisabled,
    isLoading,
    context,
  }
}

/**
 * Component slot system for flexible composition
 */
export interface SlotProps {
  children?: React.ReactNode
  fallback?: React.ReactNode
  condition?: boolean
}

export const Slot: React.FC<SlotProps> = ({ children, fallback, condition = true }) => {
  if (!condition) {
    return <>{fallback}</>
  }
  return <>{children}</>
}

/**
 * Provider pattern for component slots
 */
export interface SlotProviderProps {
  children: React.ReactNode
  slots: Record<string, React.ReactNode>
}

const SlotContext = React.createContext<Record<string, React.ReactNode>>({})

export const SlotProvider: React.FC<SlotProviderProps> = ({ children, slots }) => (
  <SlotContext.Provider value={slots}>
    {children}
  </SlotContext.Provider>
)

export const useSlot = (name: string) => {
  const slots = React.useContext(SlotContext)
  return slots[name] || null
}

/**
 * Template component for common composition patterns
 */
export interface ComponentTemplateProps {
  header?: React.ReactNode
  content: React.ReactNode
  footer?: React.ReactNode
  sidebar?: React.ReactNode
  actions?: React.ReactNode
  loading?: boolean
  error?: Error | null
  className?: string
  layout?: 'default' | 'sidebar' | 'split' | 'centered'
}

export const ComponentTemplate: React.FC<ComponentTemplateProps> = ({
  header,
  content,
  footer,
  sidebar,
  actions,
  loading,
  error,
  className,
  layout = 'default',
}) => {
  const context = useCompositionContext()
  const isLoading = loading || context.loading
  const hasError = error || context.error

  if (isLoading) {
    return <UnifiedLoading variant="skeleton" />
  }

  if (hasError) {
    return (
      <QueryErrorBoundary variant="component">
        {content}
      </QueryErrorBoundary>
    )
  }

  const layoutClasses = {
    default: 'flex flex-col space-y-4',
    sidebar: 'flex gap-4',
    split: 'grid grid-cols-2 gap-4',
    centered: 'flex flex-col items-center justify-center space-y-4',
  }

  return (
    <div className={`${layoutClasses[layout]} ${className || ''}`}>
      {header && (
        <header className="flex items-center justify-between">
          {header}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </header>
      )}
      
      <main className={sidebar ? 'flex gap-4' : 'flex-1'}>
        {sidebar && (
          <aside className="w-64 flex-shrink-0">
            {sidebar}
          </aside>
        )}
        <div className="flex-1">
          {content}
        </div>
      </main>
      
      {footer && (
        <footer>
          {footer}
        </footer>
      )}
    </div>
  )
}

export default {
  withComposition,
  withLoading,
  withErrorBoundary,
  withConditional,
  withAccessibility,
  compose,
  createComposedComponent,
  useComposedState,
  ComponentTemplate,
  Slot,
  SlotProvider,
  useSlot,
}