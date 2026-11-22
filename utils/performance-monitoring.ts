// Performance monitoring and metrics collection system

import React from 'react'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Performance metrics interface
 */
export type PerformanceMetrics = {
  // Core Web Vitals
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  fcp: number | null // First Contentful Paint
  ttfb: number | null // Time to First Byte

  // Custom metrics
  timeToInteractive: number | null
  bundleSize: number | null
  memoryUsage: number | null
  queryPerformance: {
    totalQueries: number
    averageQueryTime: number
    errorRate: number
  }
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {}
  private observers: Map<string, PerformanceObserver> = new Map()
  private queryClient: QueryClient | null = null
  private startTime: number = Date.now()

  constructor(queryClient?: QueryClient) {
    this.queryClient = queryClient || null
    this.initializeObservers()
    this.trackCustomMetrics()
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers() {
    if (typeof window === 'undefined')
      return

    // Core Web Vitals observer
    this.observeWebVitals()

    // Navigation timing observer
    this.observeNavigationTiming()

    // Resource timing observer
    this.observeResourceTiming()

    // Memory usage observer
    this.observeMemoryUsage()
  }

  /**
   * Observe Core Web Vitals
   */
  private observeWebVitals() {
    if (!('PerformanceObserver' in window))
      return

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
        this.metrics.lcp = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', lcpObserver)

      // FID Observer
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', fidObserver)

      // CLS Observer
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput)
            clsValue += entry.value
        })
        this.metrics.cls = clsValue
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('cls', clsObserver)
    }
    catch (error) {
      console.warn('Failed to initialize Core Web Vitals observers:', error)
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming() {
    if (typeof window === 'undefined' || !('performance' in window))
      return

    try {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (navigationTiming) {
        // First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        this.metrics.fcp = fcpEntry?.startTime || null

        // Time to First Byte
        this.metrics.ttfb = navigationTiming.responseStart - navigationTiming.requestStart

        // Time to Interactive (custom calculation)
        this.metrics.timeToInteractive = navigationTiming.domInteractive - navigationTiming.navigationStart
      }
    }
    catch (error) {
      console.warn('Failed to collect navigation timing:', error)
    }
  }

  /**
   * Observe resource timing for bundle size analysis
   */
  private observeResourceTiming() {
    if (typeof window === 'undefined')
      return

    try {
      const resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        let totalSize = 0

        entries.forEach((entry: any) => {
          if (entry.name.includes('.js') || entry.name.includes('.css'))
            totalSize += entry.transferSize || 0
        })

        this.metrics.bundleSize = (this.metrics.bundleSize || 0) + totalSize
      })

      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', resourceObserver)
    }
    catch (error) {
      console.warn('Failed to observe resource timing:', error)
    }
  }

  /**
   * Observe memory usage
   */
  private observeMemoryUsage() {
    if (typeof window === 'undefined' || !('performance' in window))
      return

    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.metrics.memoryUsage = memory.usedJSHeapSize
      }
    }

    // Update memory usage every 30 seconds
    updateMemoryUsage()
    setInterval(updateMemoryUsage, 30000)
  }

  /**
   * Track custom metrics
   */
  private trackCustomMetrics() {
    if (this.queryClient)
      this.trackQueryPerformance()
  }

  /**
   * Track React Query performance
   */
  private trackQueryPerformance() {
    if (!this.queryClient)
      return

    const cache = this.queryClient.getQueryCache()
    const mutationCache = this.queryClient.getMutationCache()

    let totalQueries = 0
    let totalQueryTime = 0
    let errorCount = 0

    // Subscribe to cache events
    const unsubscribeQueries = cache.subscribe((event) => {
      if (event.type === 'queryAdded') {
        totalQueries++
      }
    })

    const unsubscribeMutations = mutationCache.subscribe((event) => {
      if (event.type === 'mutationAdded') {
        const mutation = event.mutation

        // Track mutation performance
        const startTime = Date.now()

        mutation.subscribe((result) => {
          const endTime = Date.now()
          const duration = endTime - startTime

          if (result.error) {
            errorCount++
          }

          totalQueryTime += duration

          // Update metrics
          this.metrics.queryPerformance = {
            totalQueries,
            averageQueryTime: totalQueries > 0 ? totalQueryTime / totalQueries : 0,
            errorRate: totalQueries > 0 ? errorCount / totalQueries : 0,
          }
        })
      }
    })

    // Cleanup function
    this.cleanup = () => {
      unsubscribeQueries()
      unsubscribeMutations()
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      lcp: this.metrics.lcp || null,
      fid: this.metrics.fid || null,
      cls: this.metrics.cls || null,
      fcp: this.metrics.fcp || null,
      ttfb: this.metrics.ttfb || null,
      timeToInteractive: this.metrics.timeToInteractive || null,
      bundleSize: this.metrics.bundleSize || null,
      memoryUsage: this.metrics.memoryUsage || null,
      queryPerformance: this.metrics.queryPerformance || {
        totalQueries: 0,
        averageQueryTime: 0,
        errorRate: 0,
      },
    }
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const metrics = this.getMetrics()
    let score = 100

    // LCP scoring (under 2.5s is good)
    if (metrics.lcp) {
      if (metrics.lcp > 4000)
        score -= 20
      else if (metrics.lcp > 2500)
        score -= 10
    }

    // FID scoring (under 100ms is good)
    if (metrics.fid) {
      if (metrics.fid > 300)
        score -= 20
      else if (metrics.fid > 100)
        score -= 10
    }

    // CLS scoring (under 0.1 is good)
    if (metrics.cls) {
      if (metrics.cls > 0.25)
        score -= 20
      else if (metrics.cls > 0.1)
        score -= 10
    }

    // Bundle size scoring (under 500KB is good)
    if (metrics.bundleSize) {
      if (metrics.bundleSize > 1000000)
        score -= 15 // 1MB
      else if (metrics.bundleSize > 500000)
        score -= 8 // 500KB
    }

    // Query error rate scoring
    if (metrics.queryPerformance.errorRate > 0.1)
      score -= 15
    else if (metrics.queryPerformance.errorRate > 0.05)
      score -= 8

    return Math.max(0, score)
  }

  /**
   * Track user interaction timing
   */
  trackInteraction(name: string, duration: number) {
    if (process.env.NODE_ENV === 'development')
      console.debug(`Interaction '${name}' took ${duration}ms`)

    // Could send to analytics service
    this.sendToAnalytics({
      type: 'interaction',
      name,
      duration,
      timestamp: Date.now(),
    })
  }

  /**
   * Track page load performance
   */
  trackPageLoad(route: string) {
    const loadTime = Date.now() - this.startTime

    if (process.env.NODE_ENV === 'development')
      console.debug(`Page '${route}' loaded in ${loadTime}ms`)

    this.sendToAnalytics({
      type: 'pageLoad',
      route,
      loadTime,
      metrics: this.getMetrics(),
      timestamp: Date.now(),
    })
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(data: any) {
    if (typeof window === 'undefined')
      return

    // In a real app, you might send to services like:
    // - Google Analytics
    // - Datadog RUM
    // - New Relic
    // - Custom analytics endpoint

    if (process.env.NODE_ENV === 'development')
      console.debug('Analytics data:', data)

    // Example: Send to custom endpoint
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // }).catch(console.error)
  }

  /**
   * Cleanup observers
   */
  private cleanup?: () => void

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.cleanup?.()
  }
}

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitoring = (queryClient?: QueryClient) => {
  const monitorRef = React.useRef<PerformanceMonitor | null>(null)

  React.useEffect(() => {
    monitorRef.current = new PerformanceMonitor(queryClient)

    return () => {
      monitorRef.current?.destroy()
    }
  }, [queryClient])

  const trackInteraction = React.useCallback((name: string, fn: () => any) => {
    const start = performance.now()
    const result = fn()
    const end = performance.now()

    monitorRef.current?.trackInteraction(name, end - start)
    return result
  }, [])

  const trackAsyncInteraction = React.useCallback(async (name: string, fn: () => Promise<any>) => {
    const start = performance.now()
    try {
      const result = await fn()
      const end = performance.now()
      monitorRef.current?.trackInteraction(name, end - start)
      return result
    }
    catch (error) {
      const end = performance.now()
      monitorRef.current?.trackInteraction(`${name}_error`, end - start)
      throw error
    }
  }, [])

  const getMetrics = React.useCallback(() => {
    return monitorRef.current?.getMetrics() || null
  }, [])

  const getPerformanceScore = React.useCallback(() => {
    return monitorRef.current?.getPerformanceScore() || 0
  }, [])

  return {
    trackInteraction,
    trackAsyncInteraction,
    getMetrics,
    getPerformanceScore,
  }
}

/**
 * Performance budget monitoring
 */
export class PerformanceBudget {
  private budgets = {
    lcp: 2500, // 2.5 seconds
    fid: 100, // 100ms
    cls: 0.1, // 0.1
    bundleSize: 500000, // 500KB
    queryErrorRate: 0.05, // 5%
  }

  checkBudgets(metrics: PerformanceMetrics): Array<{ metric: string; actual: number; budget: number; exceeded: boolean }> {
    const results = []

    if (metrics.lcp !== null) {
      results.push({
        metric: 'LCP',
        actual: metrics.lcp,
        budget: this.budgets.lcp,
        exceeded: metrics.lcp > this.budgets.lcp,
      })
    }

    if (metrics.fid !== null) {
      results.push({
        metric: 'FID',
        actual: metrics.fid,
        budget: this.budgets.fid,
        exceeded: metrics.fid > this.budgets.fid,
      })
    }

    if (metrics.cls !== null) {
      results.push({
        metric: 'CLS',
        actual: metrics.cls,
        budget: this.budgets.cls,
        exceeded: metrics.cls > this.budgets.cls,
      })
    }

    if (metrics.bundleSize !== null) {
      results.push({
        metric: 'Bundle Size',
        actual: metrics.bundleSize,
        budget: this.budgets.bundleSize,
        exceeded: metrics.bundleSize > this.budgets.bundleSize,
      })
    }

    results.push({
      metric: 'Query Error Rate',
      actual: metrics.queryPerformance.errorRate,
      budget: this.budgets.queryErrorRate,
      exceeded: metrics.queryPerformance.errorRate > this.budgets.queryErrorRate,
    })

    return results
  }
}

/**
 * Performance debugging utilities
 */
export const PerformanceDebugger = {
  logRenderTime: (componentName: string) => {
    if (process.env.NODE_ENV !== 'development')
      return

    const start = performance.now()

    return () => {
      const end = performance.now()
      console.debug(`${componentName} render time: ${(end - start).toFixed(2)}ms`)
    }
  },

  profileFunction: <T extends (...args: any[]) => any>(
    fn: T,
    name: string,
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now()
      const result = fn(...args)
      const end = performance.now()

      console.debug(`${name} execution time: ${(end - start).toFixed(2)}ms`)
      return result
    }) as T
  },

  measureAsyncFunction: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    name: string,
  ): T => {
    return (async (...args: Parameters<T>) => {
      const start = performance.now()
      try {
        const result = await fn(...args)
        const end = performance.now()
        console.debug(`${name} async execution time: ${(end - start).toFixed(2)}ms`)
        return result
      }
      catch (error) {
        const end = performance.now()
        console.debug(`${name} async execution time (error): ${(end - start).toFixed(2)}ms`)
        throw error
      }
    }) as T
  },
}

export default PerformanceMonitor
