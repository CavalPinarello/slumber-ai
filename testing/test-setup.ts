// Comprehensive testing setup and utilities

import React, { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, RenderOptions, fireEvent } from '@testing-library/react'
import { ModalManagerProvider } from '@/components/modals/modal-manager'
import { CompositionProvider } from '@/components/composition/component-composer'
import type { ConversationItem, IChatItem } from '@/types/chat'
import type { App } from '@/types/app'

/**
 * Test utilities for React Query
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Wrapper component for tests with all providers
 */
interface TestWrapperProps {
  children: ReactNode
  queryClient?: QueryClient
  compositionContext?: any
}

const TestWrapper = ({ 
  children, 
  queryClient = createTestQueryClient(),
  compositionContext = {}
}: TestWrapperProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ModalManagerProvider>
        <CompositionProvider value={compositionContext}>
          {children}
        </CompositionProvider>
      </ModalManagerProvider>
    </QueryClientProvider>
  )
}

/**
 * Custom render function with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  compositionContext?: any
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, compositionContext, ...renderOptions } = options

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestWrapper 
      queryClient={queryClient}
      compositionContext={compositionContext}
    >
      {children}
    </TestWrapper>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Mock implementations
 */

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  })
  window.IntersectionObserver = mockIntersectionObserver
  window.IntersectionObserverEntry = {} as any
}

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn()
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  })
  window.ResizeObserver = mockResizeObserver
}

// Mock matchMedia
export const mockMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Mock localStorage
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })
  return localStorageMock
}

/**
 * API mocking utilities
 */
export const createMockApiResponse = <T>(data: T, options: {
  status?: number
  delay?: number
} = {}) => {
  const { status = 200, delay = 0 } = options
  
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      if (status >= 200 && status < 300) {
        resolve(data)
      } else {
        reject(new Error(`API Error: ${status}`))
      }
    }, delay)
  })
}

/**
 * Test data factories
 */
export const createMockConversation = (overrides: Partial<ConversationItem> = {}): ConversationItem => ({
  id: 'conv-1',
  name: 'Test Conversation',
  status: 'normal',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  message_count: 0,
  user_feedback_stats: { like: 0, dislike: 0 },
  admin_feedback_stats: { like: 0, dislike: 0 },
  is_pinned: false,
  ...overrides,
})

export const createMockMessage = (overrides: Partial<IChatItem> = {}): IChatItem => ({
  id: 'msg-1',
  message_id: 'msg-1',
  conversation_id: 'conv-1',
  content: 'Test message content',
  message_type: 'question',
  created_at: '2024-01-01T00:00:00Z',
  isAnswering: false,
  agent_thoughts: [],
  message_files: [],
  workflow_run_id: null,
  ...overrides,
})

export const createMockApp = (overrides: Partial<App> = {}): App => ({
  id: 'app-1',
  name: 'Test App',
  description: 'Test application',
  icon: '/test-icon.png',
  ...overrides,
})

/**
 * Component testing utilities
 */

// Wait for next tick
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// Wait for animation to complete
export const waitForAnimation = (duration: number = 300) => 
  new Promise(resolve => setTimeout(resolve, duration))

// Simulate user typing
export const simulateTyping = async (
  element: HTMLElement, 
  text: string, 
  delay: number = 50
) => {
  for (const char of text) {
    fireEvent.change(element, {
      target: { value: (element as HTMLInputElement).value + char }
    })
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

/**
 * Performance testing utilities
 */
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now()
  renderFn()
  await waitForNextTick()
  const end = performance.now()
  return end - start
}

export const measureAsyncOperation = async <T>(
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now()
  const result = await operation()
  const end = performance.now()
  return { result, duration: end - start }
}

/**
 * Accessibility testing utilities
 */
export const checkAccessibility = async (container: HTMLElement) => {
  const { axe } = await import('axe-core')
  const results = await axe.run(container)
  return results
}

export const findByRole = (container: HTMLElement, role: string) => {
  return container.querySelector(`[role="${role}"]`)
}

export const hasAriaLabel = (element: HTMLElement, label: string) => {
  return element.getAttribute('aria-label') === label
}

/**
 * Custom matchers for Jest
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R
      toHaveLoadedWithin(ms: number): R
      toHaveRenderedWithin(ms: number): R
    }
  }
}

// Custom Jest matchers
export const customMatchers = {
  toBeAccessible: async (received: HTMLElement) => {
    const results = await checkAccessibility(received)
    const violations = results.violations
    
    if (violations.length === 0) {
      return {
        pass: true,
        message: () => 'Expected element to have accessibility violations',
      }
    }
    
    return {
      pass: false,
      message: () => `Expected element to be accessible, but found ${violations.length} violations:\n${
        violations.map(v => `- ${v.description}`).join('\n')
      }`,
    }
  },
  
  toHaveLoadedWithin: (received: Promise<any>, ms: number) => {
    const start = Date.now()
    
    return received.then(
      () => {
        const duration = Date.now() - start
        if (duration <= ms) {
          return {
            pass: true,
            message: () => `Expected operation to take longer than ${ms}ms, but took ${duration}ms`,
          }
        }
        return {
          pass: false,
          message: () => `Expected operation to complete within ${ms}ms, but took ${duration}ms`,
        }
      },
      () => ({
        pass: false,
        message: () => 'Operation failed',
      })
    )
  },
}

/**
 * Test hooks for common scenarios
 */
export const useTestQueryClient = () => {
  const queryClient = React.useMemo(() => createTestQueryClient(), [])
  
  React.useEffect(() => {
    return () => {
      queryClient.clear()
    }
  }, [queryClient])
  
  return queryClient
}

/**
 * Integration test utilities
 */
export const createIntegrationTestEnv = () => {
  const queryClient = createTestQueryClient()
  
  // Mock all external dependencies
  mockIntersectionObserver()
  mockResizeObserver()
  mockMatchMedia()
  const localStorage = mockLocalStorage()
  
  // Setup API mocks
  const apiMocks = {
    conversations: [],
    messages: [],
    apps: [],
  }
  
  return {
    queryClient,
    apiMocks,
    localStorage,
    cleanup: () => {
      queryClient.clear()
      jest.clearAllMocks()
    }
  }
}

export default {
  renderWithProviders,
  createTestQueryClient,
  createMockApiResponse,
  createMockConversation,
  createMockMessage,
  createMockApp,
  waitForNextTick,
  waitForAnimation,
  simulateTyping,
  measureRenderTime,
  measureAsyncOperation,
  checkAccessibility,
  customMatchers,
  createIntegrationTestEnv,
}