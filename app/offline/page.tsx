// Offline page for when the app is not available

'use client'

import React from 'react'
import { useOfflineStatus } from '@/utils/service-worker'
import Button from '@/app/components/base/button'

export default function OfflinePage() {
  const { isOnline } = useOfflineStatus()

  React.useEffect(() => {
    // Redirect to home when back online
    if (isOnline)
      window.location.href = '/'
  }, [isOnline])

  const handleRetry = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-background-default flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Offline icon */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-background-secondary flex items-center justify-center">
          <svg
            className="w-12 h-12 text-text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636L5.636 18.364m12.728 0L5.636 5.636M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-text-primary mb-4">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-text-secondary mb-8 leading-relaxed">
          It looks like you've lost your internet connection. Some features may not be available until you're back online.
        </p>

        {/* Connection status */}
        <div className={`
          inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-8
          ${isOnline
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
    }
        `}>
          <div className={`
            w-2 h-2 rounded-full mr-2
            ${isOnline ? 'bg-green-400' : 'bg-red-400'}
          `} />
          {isOnline ? 'Connection restored' : 'No internet connection'}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full"
            variant="primary"
          >
            Try Again
          </Button>

          <Button
            onClick={handleGoHome}
            className="w-full"
            variant="ghost"
          >
            Go to Home Page
          </Button>
        </div>

        {/* Offline capabilities */}
        <div className="mt-12 p-6 bg-background-secondary rounded-lg text-left">
          <h3 className="font-semibold text-text-primary mb-3">
            What you can still do:
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              View recent conversations from cache
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Browse previously loaded messages
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Draft messages (will sync when online)
            </li>
          </ul>
        </div>

        {/* Tips */}
        <div className="mt-6 text-xs text-text-tertiary">
          <p>
            Tip: Check your internet connection or try connecting to a different network.
          </p>
        </div>
      </div>
    </div>
  )
}
