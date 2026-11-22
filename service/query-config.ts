// Unified React Query configuration utilities

import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'

/**
 * Default query configuration
 */
export const DEFAULT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  retry: 3,
  refetchOnWindowFocus: false,
} as const

/**
 * App-specific query configurations
 */
export const QUERY_CONFIGS = {
  // User data changes infrequently
  user: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  },

  // App list can be cached longer
  apps: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  },

  // Conversations are more dynamic
  conversations: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  },

  // Messages are very dynamic
  messages: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
  },

  // Static data like system info
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const

/**
 * Create standardized query configuration
 */
export function createQueryConfig<T>(
  key: string | string[],
  fetcher: () => Promise<T>,
  config?: {
    staleTime?: number
    cacheTime?: number
    retry?: number | boolean
    enabled?: boolean
    refetchOnWindowFocus?: boolean
  },
): UseQueryOptions<T> {
  return {
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: fetcher,
    staleTime: config?.staleTime ?? DEFAULT_QUERY_CONFIG.staleTime,
    cacheTime: config?.cacheTime ?? DEFAULT_QUERY_CONFIG.cacheTime,
    retry: config?.retry ?? DEFAULT_QUERY_CONFIG.retry,
    enabled: config?.enabled,
    refetchOnWindowFocus: config?.refetchOnWindowFocus ?? DEFAULT_QUERY_CONFIG.refetchOnWindowFocus,
  }
}

/**
 * Create app-specific query configuration
 */
export function createAppQueryConfig<T>(
  key: string | string[],
  fetcher: () => Promise<T>,
  type: keyof typeof QUERY_CONFIGS = 'apps',
  overrides?: Partial<UseQueryOptions<T>>,
): UseQueryOptions<T> {
  const baseConfig = QUERY_CONFIGS[type]

  return {
    ...createQueryConfig(key, fetcher, baseConfig),
    ...overrides,
  }
}

/**
 * Create standardized mutation configuration
 */
export function createMutationConfig<TData, TError, TVariables, TContext>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config?: {
    onSuccess?: (data: TData, variables: TVariables, context: TContext) => void
    onError?: (error: TError, variables: TVariables, context?: TContext) => void
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context?: TContext) => void
  },
): UseMutationOptions<TData, TError, TVariables, TContext> {
  return {
    mutationFn,
    ...config,
  }
}

/**
 * Common query keys for the application
 */
export const QUERY_KEYS = {
  // App related
  apps: ['apps'] as const,
  appDetail: (id: string) => ['apps', id] as const,
  appFullList: ['apps', 'full-list'] as const,

  // User related
  userProfile: ['user', 'profile'] as const,
  currentWorkspace: ['workspace', 'current'] as const,

  // Conversation related
  conversations: (appId: string) => ['conversations', appId] as const,
  conversationDetail: (id: string) => ['conversations', id] as const,

  // Message related
  messages: (conversationId: string) => ['messages', conversationId] as const,
  messageDetail: (id: string) => ['messages', id] as const,

  // System related
  systemFeatures: ['system', 'features'] as const,
  appInfo: ['app', 'info'] as const,
  parameters: ['parameters'] as const,

  // Model related
  models: (provider: string) => ['models', provider] as const,
  modelList: ['models', 'list'] as const,
} as const

/**
 * Helper to invalidate related queries
 */
export const INVALIDATION_PATTERNS = {
  // Invalidate all app-related queries
  apps: [QUERY_KEYS.apps[0]],

  // Invalidate all conversation-related queries
  conversations: ['conversations'],

  // Invalidate all message-related queries
  messages: ['messages'],

  // Invalidate user-related queries
  user: ['user', 'workspace'],
} as const

/**
 * Create paginated query configuration
 */
export function createPaginatedQueryConfig<T>(
  baseKey: string[],
  fetcher: (page: number, limit: number) => Promise<T>,
  page = 1,
  limit = 20,
  config?: Partial<UseQueryOptions<T>>,
): UseQueryOptions<T> {
  return createQueryConfig(
    [...baseKey, 'paginated', { page, limit }],
    () => fetcher(page, limit),
    config,
  )
}

export default {
  createQueryConfig,
  createAppQueryConfig,
  createMutationConfig,
  createPaginatedQueryConfig,
  QUERY_KEYS,
  QUERY_CONFIGS,
  DEFAULT_QUERY_CONFIG,
  INVALIDATION_PATTERNS,
}
