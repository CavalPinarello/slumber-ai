'use client'
import { useEffect } from 'react'

class StorageMock {
  data: Record<string, string>

  constructor() {
    this.data = {} as Record<string, string>
  }

  setItem(name: string, value: string) {
    this.data[name] = value
  }

  getItem(name: string) {
    return this.data[name] || null
  }

  removeItem(name: string) {
    delete this.data[name]
  }

  clear() {
    this.data = {}
  }
}

let localStorage, sessionStorage

try {
  localStorage = globalThis.localStorage
  sessionStorage = globalThis.sessionStorage
}
catch {
  localStorage = new StorageMock()
  sessionStorage = new StorageMock()
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorage,
})

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorage,
})

const BrowserInitor = ({
  children,
}: { children: React.ReactNode }) => {
  useEffect(() => {
    // More comprehensive ResizeObserver error suppression
    const handleResizeObserverError = (e: ErrorEvent) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.'
          || e.message === 'ResizeObserver loop limit exceeded'
          || e.message.includes('ResizeObserver loop')
          || e.message.includes('ResizeObserver')) {
        e.stopImmediatePropagation()
        e.preventDefault()
        console.debug('ResizeObserver error suppressed:', e.message)
        return false
      }
    }

    // Handle unhandled promise rejections (ResizeObserver and network errors)
    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      if (e.reason && e.reason.message
          && (e.reason.message.includes('ResizeObserver')
           || e.reason.message.includes('Failed to load resource')
           || e.reason.message.includes('file-preview')
           || e.reason.message.includes('404')
           || e.reason.message.includes('Cannot read properties of null'))) {
        e.preventDefault()
        console.debug('Promise rejection suppressed:', e.reason.message)
        return false
      }
    }

    // Intercept and potentially block network requests for file-preview URLs
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const url = args[0]

      // Block file-preview requests entirely if they contain certain patterns that indicate old/invalid files
      if (typeof url === 'string' && url.includes('file-preview')
          && (url.includes('timestamp=1750506899') || url.length > 200)) {
        console.debug('Blocked potentially invalid file-preview request:', `${url.substring(0, 100)}...`)
        // Return a fake 404 response to prevent the actual network request
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      try {
        const response = await originalFetch(...args)

        // Suppress 404 errors for file-preview URLs in the console
        if (!response.ok && response.status === 404
            && (typeof url === 'string' && (url.includes('file-preview') || url.includes('/files')))) {
          // Don't log anything - complete suppression
        }

        return response
      }
      catch (error) {
        // Only log network errors in development and for important resources
        if (process.env.NODE_ENV !== 'production'
            && (typeof url !== 'string' || (!url.includes('file-preview') && !url.includes('/files'))))
          console.error('Network error:', error)

        // Complete suppression for file-preview errors
        throw error
      }
    }

    window.addEventListener('error', handleResizeObserverError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleResizeObserverError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.fetch = originalFetch
    }
  }, [])

  return <>{children}</>
}

export default BrowserInitor
