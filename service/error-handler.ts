import Toast from '@/app/components/base/toast'

export type ApiError = {
  code: string
  message: string
  status: number
  details?: any
}

export type ErrorHandlerOptions = {
  silent?: boolean
  skipToast?: boolean
  skipLogging?: boolean
  customHandler?: (error: ApiError) => void
}

/**
 * Centralized API error handler for the application
 */
export class ApiErrorHandler {
  /**
   * Handle API errors with unified logic
   */
  static handle(error: any, options: ErrorHandlerOptions = {}): void {
    const {
      silent = false,
      skipToast = false,
      skipLogging = false,
      customHandler,
    } = options

    let apiError: ApiError

    // Normalize error structure
    if (error.response) {
      // Fetch response error
      apiError = {
        code: error.response.status?.toString() || 'UNKNOWN',
        message: error.message || 'An error occurred',
        status: error.response.status || 500,
        details: error.response,
      }
    }
    else if (error.message) {
      // Standard error object
      apiError = {
        code: error.code || 'CLIENT_ERROR',
        message: error.message,
        status: 0,
        details: error,
      }
    }
    else if (typeof error === 'string') {
      // String error
      apiError = {
        code: 'STRING_ERROR',
        message: error,
        status: 0,
      }
    }
    else {
      // Unknown error format
      apiError = {
        code: 'UNKNOWN',
        message: 'An unknown error occurred',
        status: 0,
        details: error,
      }
    }

    // Skip handling for certain error types
    if (this.shouldSkipError(apiError))
      return

    // Logging
    if (!skipLogging)
      this.logError(apiError)

    // Toast notification
    if (!silent && !skipToast && this.shouldShowToast(apiError))
      this.showToast(apiError)

    // Custom error handling
    if (customHandler)
      customHandler(apiError)

    // Report to external services if needed
    this.reportError(apiError)
  }

  /**
   * Handle SSE (Server-Sent Events) errors specifically
   */
  static handleSSEError(
    error: string,
    errorCode?: string,
    options: ErrorHandlerOptions = {},
  ): void {
    let enhancedError = error

    // Enhance error messages for common file validation errors
    if (error.includes('failed validation at the AI service level'))
      enhancedError = 'File validation failed: The uploaded file is not supported by the AI service. Please ensure you are uploading a supported file type (PDF, TXT, DOC, DOCX, MD, HTML, XLSX, XLS, CSV, JSON, XML, etc.) and that the file is not corrupted.'
    else if (error.includes('file type not supported'))
      enhancedError = 'Unsupported file type: Please upload a file in one of the supported formats.'
    else if (error.includes('file size') || error.includes('too large'))
      enhancedError = 'File size error: The file is too large. Maximum file size is 10MB.'

    const apiError: ApiError = {
      code: errorCode || 'SSE_ERROR',
      message: enhancedError,
      status: 0,
    }

    // Skip certain SSE errors that are expected
    if (this.shouldSkipSSEError(error))
      return

    this.handle(apiError, options)
  }

  /**
   * Handle fetch response errors with proper status code handling
   */
  static async handleFetchError(
    response: Response,
    options: ErrorHandlerOptions = {},
  ): Promise<void> {
    let message = 'Server Error'
    let details: any

    try {
      const data = await response.json()
      message = data.message || message
      details = data
    }
    catch {
      // Unable to parse JSON, use default message
    }

    const apiError: ApiError = {
      code: response.status.toString(),
      message,
      status: response.status,
      details,
    }

    // Special handling for specific status codes
    switch (response.status) {
      case 401:
        this.handleUnauthorized()
        break
      case 403:
        this.handleForbidden()
        break
      case 429:
        this.handleRateLimit(apiError)
        break
      default:
        this.handle(apiError, options)
    }
  }

  /**
   * Check if error should be skipped
   */
  private static shouldSkipError(error: ApiError): boolean {
    // Skip errors that are user-initiated cancellations
    const skipMessages = [
      'AbortError: The user aborted a request.',
      'TypeError: Cannot assign to read only property',
    ]

    return skipMessages.some(msg => error.message.includes(msg))
  }

  /**
   * Check if SSE error should be skipped
   */
  private static shouldSkipSSEError(errorMessage: string): boolean {
    const skipMessages = [
      'AbortError: The user aborted a request.',
      'TypeError: Cannot assign to read only property',
    ]

    return skipMessages.some(msg => errorMessage.includes(msg))
  }

  /**
   * Check if toast should be shown for this error
   */
  private static shouldShowToast(error: ApiError): boolean {
    // Don't show toast for certain status codes
    const skipToastStatuses = [401, 404]
    return !skipToastStatuses.includes(error.status)
  }

  /**
   * Log error to console and external services
   */
  private static logError(error: ApiError): void {
    console.error('API Error:', {
      code: error.code,
      message: error.message,
      status: error.status,
      timestamp: new Date().toISOString(),
      details: error.details,
    })
  }

  /**
   * Show toast notification
   */
  private static showToast(error: ApiError): void {
    // Use longer duration for file validation errors
    const duration = error.message.includes('file') || error.message.includes('validation') ? 5000 : undefined

    Toast.notify({
      type: 'error',
      message: error.message || 'An error occurred',
      duration,
    })
  }

  /**
   * Handle unauthorized errors
   */
  private static handleUnauthorized(): void {
    // Redirect to sign-in page
    if (typeof window !== 'undefined')
      window.location.href = `${window.location.origin}/signin`
  }

  /**
   * Handle forbidden errors
   */
  private static handleForbidden(): void {
    Toast.notify({
      type: 'error',
      message: 'Access forbidden. You do not have permission to access this resource.',
    })
  }

  /**
   * Handle rate limit errors
   */
  private static handleRateLimit(error: ApiError): void {
    Toast.notify({
      type: 'error',
      message: 'Rate limit exceeded. Please try again later.',
    })
  }

  /**
   * Report error to external monitoring service
   */
  private static reportError(error: ApiError): void {
    // TODO: Implement error reporting to external service
    // This could be Sentry, LogRocket, or custom error tracking
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error)
    }
  }

  /**
   * Create error handler for specific contexts
   */
  static createHandler(defaultOptions: ErrorHandlerOptions = {}) {
    return (error: any, contextOptions: ErrorHandlerOptions = {}) => {
      this.handle(error, { ...defaultOptions, ...contextOptions })
    }
  }

  /**
   * Async wrapper for error handling
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {},
  ): Promise<T | null> {
    try {
      return await operation()
    }
    catch (error) {
      this.handle(error, options)
      return null
    }
  }
}

// Convenience functions for common error handling patterns
export const handleApiError = ApiErrorHandler.handle.bind(ApiErrorHandler)
export const handleSSEError = ApiErrorHandler.handleSSEError.bind(ApiErrorHandler)
export const handleFetchError = ApiErrorHandler.handleFetchError.bind(ApiErrorHandler)

// Create pre-configured handlers for different contexts
export const createSilentErrorHandler = () =>
  ApiErrorHandler.createHandler({ silent: true })

export const createToastOnlyErrorHandler = () =>
  ApiErrorHandler.createHandler({ skipLogging: true })

export const createChatErrorHandler = () =>
  ApiErrorHandler.createHandler({
    customHandler: (error) => {
      // Chat-specific error handling
      console.log('Chat error:', error)
    },
  })

export default ApiErrorHandler
