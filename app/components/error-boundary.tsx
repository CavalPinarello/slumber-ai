'use client'

import React from 'react'

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

type ErrorBoundaryProps = {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error | null; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
      if (FallbackComponent)
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />

      // Check if it's an environment configuration error
      const errorMessage = this.state.error?.message || ''
      const isEnvError = errorMessage.includes('NEXT_PUBLIC_')

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {isEnvError ? 'Configuration Error' : 'Something went wrong'}
            </h2>
            {isEnvError ? (
              <>
                <p className="text-gray-600 mb-4">
                  The application is not properly configured. Please ensure all required environment variables are set:
                </p>
                <ul className="text-left text-sm text-gray-600 mb-4 bg-gray-100 p-4 rounded">
                  <li className="mb-1">• NEXT_PUBLIC_APP_ID</li>
                  <li className="mb-1">• NEXT_PUBLIC_APP_KEY</li>
                  <li className="mb-1">• NEXT_PUBLIC_API_URL</li>
                </ul>
                <p className="text-xs text-gray-500 mb-4">
                  In Vercel, these should be added in Settings → Environment Variables
                </p>
              </>
            ) : (
              <p className="text-gray-600 mb-4">
                An error occurred while rendering this component.
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-gray-500">Error details</summary>
                <pre className="mt-2 overflow-auto bg-gray-100 p-2 text-xs rounded max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
