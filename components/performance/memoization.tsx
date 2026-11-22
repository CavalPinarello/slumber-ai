// Component memoization and performance optimization utilities

import React from 'react'
import { debounce, throttle } from 'lodash-es'

/**
 * Enhanced React.memo with deep comparison for complex props
 */
export const memoWithDeepCompare = <P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  const MemoizedComponent = React.memo(Component, areEqual || deepEqual)
  MemoizedComponent.displayName = `MemoWithDeepCompare(${Component.displayName || Component.name})`
  return MemoizedComponent
}

/**
 * Deep equality check for props comparison
 */
function deepEqual<T>(prev: T, next: T): boolean {
  if (prev === next) return true
  
  if (prev == null || next == null) return prev === next
  
  if (typeof prev !== 'object' || typeof next !== 'object') return prev === next
  
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  
  if (prevKeys.length !== nextKeys.length) return false
  
  for (const key of prevKeys) {
    if (!nextKeys.includes(key)) return false
    if (!deepEqual((prev as any)[key], (next as any)[key])) return false
  }
  
  return true
}

/**
 * Shallow equality check for performance
 */
function shallowEqual<T extends object>(prev: T, next: T): boolean {
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  
  if (prevKeys.length !== nextKeys.length) return false
  
  for (const key of prevKeys) {
    if ((prev as any)[key] !== (next as any)[key]) return false
  }
  
  return true
}

/**
 * React.memo with shallow comparison (default behavior, explicitly named)
 */
export const memoWithShallowCompare = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const MemoizedComponent = React.memo(Component, shallowEqual)
  MemoizedComponent.displayName = `MemoWithShallowCompare(${Component.displayName || Component.name})`
  return MemoizedComponent
}

/**
 * Custom hook for memoizing expensive calculations
 */
export const useExpensiveMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
) => {
  return React.useMemo(() => {
    if (process.env.NODE_ENV === 'development' && debugName) {
      console.time(`useMemo:${debugName}`)
    }
    
    const result = factory()
    
    if (process.env.NODE_ENV === 'development' && debugName) {
      console.timeEnd(`useMemo:${debugName}`)
    }
    
    return result
  }, deps)
}

/**
 * Custom hook for memoizing callbacks with performance tracking
 */
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T => {
  return React.useCallback((...args: Parameters<T>) => {
    if (process.env.NODE_ENV === 'development' && debugName) {
      console.time(`useCallback:${debugName}`)
    }
    
    const result = callback(...args)
    
    if (process.env.NODE_ENV === 'development' && debugName) {
      console.timeEnd(`useCallback:${debugName}`)
    }
    
    return result
  }, deps) as T
}

/**
 * Debounced callback hook
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T => {
  const debouncedCallback = React.useMemo(
    () => debounce(callback, delay),
    [callback, delay, ...deps]
  )
  
  React.useEffect(() => {
    return () => {
      debouncedCallback.cancel()
    }
  }, [debouncedCallback])
  
  return debouncedCallback as T
}

/**
 * Throttled callback hook
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T => {
  const throttledCallback = React.useMemo(
    () => throttle(callback, delay),
    [callback, delay, ...deps]
  )
  
  React.useEffect(() => {
    return () => {
      throttledCallback.cancel()
    }
  }, [throttledCallback])
  
  return throttledCallback as T
}

/**
 * Hook for batching state updates
 */
export const useBatchedState = <T>(initialState: T) => {
  const [state, setState] = React.useState(initialState)
  const [pendingUpdates, setPendingUpdates] = React.useState<((prev: T) => T)[]>([])
  
  const batchedSetState = React.useCallback((updater: T | ((prev: T) => T)) => {
    const updateFunction = typeof updater === 'function' ? updater as (prev: T) => T : () => updater
    
    setPendingUpdates(prev => [...prev, updateFunction])
  }, [])
  
  React.useEffect(() => {
    if (pendingUpdates.length > 0) {
      React.startTransition(() => {
        setState(currentState => {
          return pendingUpdates.reduce((acc, update) => update(acc), currentState)
        })
        setPendingUpdates([])
      })
    }
  }, [pendingUpdates])
  
  return [state, batchedSetState] as const
}

/**
 * Hook for preventing unnecessary re-renders during rapid updates
 */
export const useStableRef = <T>(value: T) => {
  const ref = React.useRef(value)
  ref.current = value
  return ref
}

/**
 * Hook for memoizing component props to prevent child re-renders
 */
export const useStableProps = <T extends object>(props: T): T => {
  const stableProps = React.useRef<T>(props)
  
  // Only update if props actually changed
  if (!shallowEqual(stableProps.current, props)) {
    stableProps.current = props
  }
  
  return stableProps.current
}

/**
 * Higher-order component for automatic performance optimization
 */
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    memo?: 'shallow' | 'deep' | 'custom'
    customCompare?: (prevProps: P, nextProps: P) => boolean
    debugName?: string
  } = {}
) => {
  const { memo = 'shallow', customCompare, debugName } = options
  
  let OptimizedComponent: React.ComponentType<P>
  
  switch (memo) {
    case 'deep':
      OptimizedComponent = memoWithDeepCompare(Component)
      break
    case 'custom':
      OptimizedComponent = React.memo(Component, customCompare)
      break
    case 'shallow':
    default:
      OptimizedComponent = React.memo(Component)
      break
  }
  
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    // Track renders in development
    const renderCount = React.useRef(0)
    renderCount.current++
    
    if (process.env.NODE_ENV === 'development' && debugName) {
      console.debug(`${debugName} rendered ${renderCount.current} times`)
    }
    
    return <OptimizedComponent {...props} ref={ref} />
  })
  
  WrappedComponent.displayName = `WithPerformanceOptimization(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook for tracking component performance
 */
export const usePerformanceTracking = (componentName: string) => {
  const renderCount = React.useRef(0)
  const mountTime = React.useRef(Date.now())
  
  renderCount.current++
  
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${componentName} mounted in ${Date.now() - mountTime.current}ms`)
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`${componentName} unmounted after ${renderCount.current} renders`)
      }
    }
  }, [componentName])
  
  return { renderCount: renderCount.current }
}

/**
 * Hook for preventing effects during rapid state changes
 */
export const useStabilizedEffect = (
  effect: React.EffectCallback,
  deps: React.DependencyList,
  delay: number = 100
) => {
  const timeoutRef = React.useRef<NodeJS.Timeout>()
  
  React.useEffect(() => {
    clearTimeout(timeoutRef.current)
    
    timeoutRef.current = setTimeout(() => {
      effect()
    }, delay)
    
    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, deps)
}

/**
 * Context optimization utility
 */
export const createOptimizedContext = <T>(defaultValue: T, displayName?: string) => {
  const Context = React.createContext(defaultValue)
  
  if (displayName) {
    Context.displayName = displayName
  }
  
  const Provider: React.FC<{ value: T; children: React.ReactNode }> = ({ value, children }) => {
    const stableValue = useStableProps(value)
    return <Context.Provider value={stableValue}>{children}</Context.Provider>
  }
  
  const useContext = () => {
    const context = React.useContext(Context)
    if (context === undefined) {
      throw new Error(`useContext must be used within a ${displayName || 'Context'} Provider`)
    }
    return context
  }
  
  return { Provider, useContext, Context }
}

/**
 * Virtual list hook for large datasets
 */
export const useVirtualList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0)
  
  const visibleItems = React.useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    }
  }, [items, itemHeight, containerHeight, scrollTop])
  
  const onScroll = React.useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])
  
  return {
    ...visibleItems,
    onScroll,
  }
}

export default {
  memoWithDeepCompare,
  memoWithShallowCompare,
  useExpensiveMemo,
  useOptimizedCallback,
  useDebouncedCallback,
  useThrottledCallback,
  useBatchedState,
  useStableRef,
  useStableProps,
  withPerformanceOptimization,
  usePerformanceTracking,
  useStabilizedEffect,
  createOptimizedContext,
  useVirtualList,
}