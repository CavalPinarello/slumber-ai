// Enhanced error boundary specifically for React Query errors

import React from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import Button from '@/app/components/base/button'
import { handleApiError } from '@/service/error-handler'

type QueryErrorFallbackProps = {
  error: Error
  resetErrorBoundary: () => void
  variant?: 'page' | 'component' | 'inline'
}

const QueryErrorFallback: React.FC<QueryErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  variant = 'component',
}) => {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isServerError = error.message.includes('500') || error.message.includes('Internal Server Error')

  const getErrorTitle = () => {
    if (isNetworkError)
      return 'Connection Error'
    if (isServerError)
      return 'Server Error'
    return 'Something went wrong'
  }

  const getErrorMessage = () => {
    if (isNetworkError)
      return 'Unable to connect to the server. Please check your internet connection and try again.'

    if (isServerError)
      return 'The server encountered an error. Please try again in a moment.'

    return error.message || 'An unexpected error occurred. Please try again.'
  }

  const handleRetry = () => {
    resetErrorBoundary()
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-text-tertiary">
        <span>Failed to load</span>
        <Button
          variant="ghost"
          size="small"
          onClick={handleRetry}
          className="ml-2"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (variant === 'page') {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            {getErrorTitle()}
          </h1>
          <p className="text-text-secondary mb-6">
            {getErrorMessage()}
          </p>
          <div className="space-x-3">
            <Button onClick={handleRetry} variant="primary">
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Default 'component' variant
  return (
    <div className="flex flex-col items-center justify-center p-6 border border-divider-subtle rounded-lg bg-background-secondary">
      <div className="text-3xl mb-3">❌</div>
      <h3 className="text-lg font-medium text-text-primary mb-2">
        {getErrorTitle()}
      </h3>
      <p className="text-sm text-text-secondary mb-4 text-center">
        {getErrorMessage()}
      </p>
      <Button onClick={handleRetry} size="small">
        Try Again
      </Button>
    </div>
  )
}

type QueryErrorBoundaryProps = {
  children: React.ReactNode
  variant?: 'page' | 'component' | 'inline'
  fallback?: React.ComponentType<QueryErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({
  children,
  variant = 'component',
  fallback: CustomFallback,
  onError,
}) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={CustomFallback || (props => (
            <QueryErrorFallback {...props} variant={variant} />
          ))}
          onError={(error, errorInfo) => {
            // Log error to external service
            console.error('Query Error Boundary caught an error:', error, errorInfo)
            handleApiError(error, { skipToast: true })
            onError?.(error, errorInfo)
          }}
          onReset={reset}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

export default QueryErrorBoundary
