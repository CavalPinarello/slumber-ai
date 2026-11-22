// Unified loading component with consistent patterns

import React from 'react'
import Skeleton from '@/app/components/base/skeleton'
import cn from '@/utils/classnames'

type LoadingVariant = 'spinner' | 'skeleton' | 'dots' | 'pulse' | 'shimmer'
type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type LoadingPosition = 'center' | 'left' | 'right' | 'top' | 'inline'

type UnifiedLoadingProps = {
  variant?: LoadingVariant
  size?: LoadingSize
  position?: LoadingPosition
  text?: string
  className?: string
  fullPage?: boolean
  overlay?: boolean
  children?: React.ReactNode
}

const LoadingSpinner: React.FC<{ size: LoadingSize; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-primary-600', sizeClasses[size], className)} />
  )
}

const LoadingDots: React.FC<{ size: LoadingSize }> = ({ size }) => {
  const dotSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={cn(
            'bg-primary-600 rounded-full animate-pulse',
            dotSizes[size],
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  )
}

const LoadingPulse: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('animate-pulse', className)}>
    {children || (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    )}
  </div>
)

const LoadingShimmer: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]', className)}>
    <div className="h-full w-full bg-gray-200 rounded" />
  </div>
)

export const UnifiedLoading: React.FC<UnifiedLoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  position = 'center',
  text,
  className,
  fullPage = false,
  overlay = false,
  children,
}) => {
  const positionClasses = {
    center: 'flex items-center justify-center',
    left: 'flex items-center justify-start',
    right: 'flex items-center justify-end',
    top: 'flex items-start justify-center pt-8',
    inline: 'inline-flex items-center',
  }

  const containerClasses = cn(
    positionClasses[position],
    fullPage && 'h-screen w-screen',
    overlay && 'absolute inset-0 bg-background-overlay backdrop-blur-sm z-50',
    className,
  )

  const renderLoadingElement = () => {
    switch (variant) {
      case 'spinner':
        return <LoadingSpinner size={size} />

      case 'skeleton':
        return children ? <LoadingPulse>{children}</LoadingPulse> : <Skeleton />

      case 'dots':
        return <LoadingDots size={size} />

      case 'pulse':
        return <LoadingPulse>{children}</LoadingPulse>

      case 'shimmer':
        return <LoadingShimmer className="h-8 w-32 rounded" />

      default:
        return <LoadingSpinner size={size} />
    }
  }

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-2">
        {renderLoadingElement()}
        {text && (
          <p className="text-sm text-text-tertiary animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

// Specialized loading components for common use cases
export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <UnifiedLoading variant="spinner" size="lg" position="center" fullPage text={text} />
)

export const ComponentLoading: React.FC<{ text?: string; className?: string }> = ({ text, className }) => (
  <UnifiedLoading variant="spinner" size="md" position="center" text={text} className={cn('p-8', className)} />
)

export const InlineLoading: React.FC<{ text?: string; size?: LoadingSize }> = ({ text, size = 'sm' }) => (
  <UnifiedLoading variant="spinner" size={size} position="inline" text={text} />
)

export const SkeletonLoading: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => (
  <UnifiedLoading variant="skeleton" className={className}>
    {children}
  </UnifiedLoading>
)

export const OverlayLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <UnifiedLoading variant="spinner" size="lg" position="center" overlay text={text} />
)

// Hook for managing loading states
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState)

  const startLoading = React.useCallback(() => setIsLoading(true), [])
  const stopLoading = React.useCallback(() => setIsLoading(false), [])
  const toggleLoading = React.useCallback(() => setIsLoading(prev => !prev), [])

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setIsLoading,
  }
}

// Higher-order component for automatic loading states
export const withLoadingBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: Partial<UnifiedLoadingProps>,
) => {
  return React.forwardRef<any, P & { isLoading?: boolean }>((props, ref) => {
    const { isLoading, ...componentProps } = props

    if (isLoading)
      return <UnifiedLoading {...loadingProps} />

    return <Component {...(componentProps as P)} ref={ref} />
  })
}

export default UnifiedLoading
