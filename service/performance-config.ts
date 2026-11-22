// Advanced React Query performance configurations and optimizations

import React from 'react'
import type { QueryClientConfig } from '@tanstack/react-query'
import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

/**
 * Performance-optimized React Query configuration
 */
export const performanceQueryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Increase stale time for better caching
      staleTime: 5 * 60 * 1000, // 5 minutes (up from 30 seconds)

      // Reduce garbage collection time
      gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime)

      // Background refetch optimizations
      refetchOnWindowFocus: false, // Reduce unnecessary requests
      refetchOnMount: true,
      refetchOnReconnect: 'always',

      // Retry configuration for better reliability
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429)
          return false

        return failureCount < 3
      },

      // Exponential backoff for retries
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode for offline handling
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations on network errors
      retry: (failureCount, error: any) => {
        if (error?.name === 'NetworkError' && failureCount < 2)
          return true

        return false
      },

      // Network mode for mutations
      networkMode: 'online',
    },
  },
}

/**
 * Create performance-optimized QueryClient
 */
export const createPerformanceQueryClient = () => {
  const queryClient = new QueryClient(performanceQueryConfig)

  // Enable broadcast for multi-tab sync
  broadcastQueryClient({
    queryClient,
    broadcastChannel: 'react-query',
  })

  return queryClient
}

/**
 * Persistence configuration for offline support
 */
export const createPersistenceConfig = () => {
  if (typeof window === 'undefined')
    return null

  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'react-query-cache',
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  })

  return {
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    buster: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  }
}

/**
 * Query prefetching strategies
 */
export class QueryPrefetchManager {
  private queryClient: QueryClient

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  /**
   * Prefetch conversations on app load
   */
  async prefetchInitialData(appId: string) {
    const promises = [
      // Prefetch conversation list
      this.queryClient.prefetchQuery({
        queryKey: ['conversations', appId],
        queryFn: () => import('@/service/index').then(m => m.fetchConversationList(appId)),
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),

      // Prefetch app info
      this.queryClient.prefetchQuery({
        queryKey: ['app', 'info'],
        queryFn: () => import('@/service/index').then(m => m.fetchAppInfo()),
        staleTime: 30 * 60 * 1000, // 30 minutes
      }),
    ]

    return Promise.allSettled(promises)
  }

  /**
   * Prefetch conversation messages on hover
   */
  async prefetchConversationMessages(conversationId: string) {
    return this.queryClient.prefetchQuery({
      queryKey: ['messages', conversationId],
      queryFn: () => import('@/service/index').then(m => m.fetchMessages(conversationId)),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  /**
   * Prefetch user data on authentication
   */
  async prefetchUserData() {
    return this.queryClient.prefetchQuery({
      queryKey: ['user', 'profile'],
      queryFn: () => import('@/service/index').then(m => m.fetchUserProfile()),
      staleTime: 15 * 60 * 1000, // 15 minutes
    })
  }

  /**
   * Prefetch related data when conversation is selected
   */
  async prefetchConversationRelated(conversationId: string, appId: string) {
    const promises = [
      // Prefetch message list
      this.prefetchConversationMessages(conversationId),

      // Prefetch conversation details
      this.queryClient.prefetchQuery({
        queryKey: ['conversation', conversationId],
        queryFn: () => import('@/service/index').then(m => m.fetchConversationDetail(conversationId)),
        staleTime: 10 * 60 * 1000,
      }),
    ]

    return Promise.allSettled(promises)
  }
}

/**
 * Background sync configuration
 */
export class BackgroundSyncManager {
  private queryClient: QueryClient
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  /**
   * Start background sync for active conversation
   */
  startConversationSync(conversationId: string, interval = 30000) {
    this.stopConversationSync(conversationId) // Clear existing

    const syncInterval = setInterval(() => {
      // Only sync if tab is visible and user is active
      if (document.visibilityState === 'visible') {
        this.queryClient.invalidateQueries({
          queryKey: ['messages', conversationId],
          refetchType: 'none', // Don't refetch immediately
        })

        // Refetch in background
        this.queryClient.refetchQueries({
          queryKey: ['messages', conversationId],
          type: 'active',
        })
      }
    }, interval)

    this.syncIntervals.set(conversationId, syncInterval)
  }

  /**
   * Stop background sync for conversation
   */
  stopConversationSync(conversationId: string) {
    const interval = this.syncIntervals.get(conversationId)
    if (interval) {
      clearInterval(interval)
      this.syncIntervals.delete(conversationId)
    }
  }

  /**
   * Start conversation list sync
   */
  startConversationListSync(appId: string, interval = 60000) {
    const key = `conversations-${appId}`
    this.stopSync(key)

    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.queryClient.invalidateQueries({
          queryKey: ['conversations', appId],
          refetchType: 'none',
        })
      }
    }, interval)

    this.syncIntervals.set(key, syncInterval)
  }

  /**
   * Stop specific sync
   */
  stopSync(key: string) {
    const interval = this.syncIntervals.get(key)
    if (interval) {
      clearInterval(interval)
      this.syncIntervals.delete(key)
    }
  }

  /**
   * Stop all background sync
   */
  stopAllSync() {
    this.syncIntervals.forEach(interval => clearInterval(interval))
    this.syncIntervals.clear()
  }

  /**
   * Clean up on unmount
   */
  destroy() {
    this.stopAllSync()
  }
}

/**
 * Intelligent cache management
 */
export class CacheManager {
  private queryClient: QueryClient

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  /**
   * Intelligent cache warming
   */
  async warmCache(appId: string, userId?: string) {
    const prefetchManager = new QueryPrefetchManager(this.queryClient)

    // Warm essential data
    await prefetchManager.prefetchInitialData(appId)

    if (userId)
      await prefetchManager.prefetchUserData()
  }

  /**
   * Clean old cache entries
   */
  cleanOldCache() {
    // Remove queries older than 1 hour that aren't currently being used
    this.queryClient.getQueryCache().getAll().forEach((query) => {
      const isOld = Date.now() - query.state.dataUpdatedAt > 60 * 60 * 1000
      const isInactive = query.getObserversCount() === 0

      if (isOld && isInactive)
        this.queryClient.removeQueries({ queryKey: query.queryKey })
    })
  }

  /**
   * Optimize cache for memory usage
   */
  optimizeMemoryUsage() {
    // Set shorter GC time for inactive queries
    this.queryClient.setDefaultOptions({
      queries: {
        gcTime: 5 * 60 * 1000, // 5 minutes for inactive queries
      },
    })

    // Clean old cache entries
    this.cleanOldCache()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const cache = this.queryClient.getQueryCache()
    const allQueries = cache.getAll()

    return {
      totalQueries: allQueries.length,
      activeQueries: allQueries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: allQueries.filter(q => q.isStale()).length,
      cacheSize: this.estimateCacheSize(allQueries),
    }
  }

  private estimateCacheSize(queries: any[]): number {
    return queries.reduce((total, query) => {
      try {
        return total + JSON.stringify(query.state.data || {}).length
      }
      catch {
        return total
      }
    }, 0)
  }
}

/**
 * Performance monitoring hooks
 */
export const useQueryPerformanceMonitoring = () => {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    const cache = queryClient.getQueryCache()

    const unsubscribe = cache.subscribe((event) => {
      if (event.type === 'queryAdded')
        console.debug('Query added:', event.query.queryKey)
      else if (event.type === 'queryRemoved')
        console.debug('Query removed:', event.query.queryKey)
    })

    return unsubscribe
  }, [queryClient])
}

export default {
  createPerformanceQueryClient,
  createPersistenceConfig,
  QueryPrefetchManager,
  BackgroundSyncManager,
  CacheManager,
}
