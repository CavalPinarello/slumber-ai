// Dynamic imports and lazy loading for performance optimization

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { UnifiedLoading } from '@/components/loading/unified-loading'
import { QueryErrorBoundary } from '@/components/error-boundaries/query-error-boundary'

/**
 * Loading fallback components for different scenarios
 */
export const ComponentLoadingFallback: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'skeleton' | 'pulse'
  text?: string
}> = ({
  size = 'md',
  variant = 'skeleton',
  text = 'Loading component...',
}) => (
  <div className="flex items-center justify-center p-8">
    <UnifiedLoading
      variant={variant}
      size={size}
      text={text}
      position="center"
    />
  </div>
)

export const EditorLoadingFallback: React.FC = () => (
  <div className="border border-divider-subtle rounded-lg p-8 bg-background-secondary">
    <UnifiedLoading
      variant="skeleton"
      size="lg"
      text="Loading editor..."
    >
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded w-full" />
        <div className="h-32 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </UnifiedLoading>
  </div>
)

export const ChartLoadingFallback: React.FC = () => (
  <div className="border border-divider-subtle rounded-lg p-6 bg-background-secondary">
    <UnifiedLoading
      variant="skeleton"
      text="Loading chart..."
    >
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded w-full" />
      </div>
    </UnifiedLoading>
  </div>
)

/**
 * Lazy-loaded Monaco Editor (12MB savings on initial load)
 */
export const LazyMonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => <EditorLoadingFallback />,
  },
)

/**
 * Lazy-loaded Prompt Editor with Lexical
 */
export const LazyPromptEditor = dynamic(
  () => import('@/app/components/base/prompt-editor').then(mod => ({
    default: mod.default,
  })),
  {
    ssr: false,
    loading: () => <EditorLoadingFallback />,
  },
)

/**
 * Lazy-loaded ECharts components (2MB savings)
 */
export const LazyEChartsReact = dynamic(
  () => import('echarts-for-react').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => <ChartLoadingFallback />,
  },
)

/**
 * Lazy-loaded ReactFlow for workflow diagrams
 */
export const LazyReactFlow = dynamic(
  () => import('reactflow').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <ComponentLoadingFallback
        size="lg"
        variant="skeleton"
        text="Loading workflow diagram..."
      />
    ),
  },
)

/**
 * Lazy-loaded PDF Highlighter
 */
export const LazyPdfHighlighter = dynamic(
  () => import('react-pdf-highlighter').then(mod => ({
    default: mod.PdfHighlighter,
  })),
  {
    ssr: false,
    loading: () => (
      <ComponentLoadingFallback
        text="Loading PDF viewer..."
        variant="skeleton"
      />
    ),
  },
)

/**
 * Lazy-loaded Canvas component
 */
export const LazyCanvas = dynamic(
  () => import('canvas').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <ComponentLoadingFallback
        text="Loading canvas..."
        variant="spinner"
      />
    ),
  },
)

/**
 * Higher-order component for lazy loading with error boundaries
 */
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType,
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>,
) => {
  const LazyComponent = dynamic(importFunc, {
    ssr: false,
    loading: fallback || (() => <ComponentLoadingFallback />),
  })

  return React.forwardRef<any, P>((props, ref) => (
    <QueryErrorBoundary
      variant="component"
      fallback={errorFallback}
    >
      <Suspense fallback={fallback ? <fallback /> : <ComponentLoadingFallback />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </QueryErrorBoundary>
  ))
}

/**
 * Lazy-loaded file upload components
 */
export const LazyFileUploader = dynamic(
  () => import('@/app/components/base/file-uploader').then(mod => ({
    default: mod.default,
  })),
  {
    ssr: false,
    loading: () => (
      <div className="border-2 border-dashed border-divider-subtle rounded-lg p-8">
        <ComponentLoadingFallback
          text="Loading file uploader..."
          variant="spinner"
          size="sm"
        />
      </div>
    ),
  },
)

export const LazyImageUploader = dynamic(
  () => import('@/app/components/base/image-uploader').then(mod => ({
    default: mod.default,
  })),
  {
    ssr: false,
    loading: () => (
      <div className="border-2 border-dashed border-divider-subtle rounded-lg p-8">
        <ComponentLoadingFallback
          text="Loading image uploader..."
          variant="spinner"
          size="sm"
        />
      </div>
    ),
  },
)

/**
 * Lazy-loaded debug/admin components (should only load for admins)
 */
export const LazyDebugPanel = dynamic(
  () => import('@/app/components/debug-panel').then(mod => ({
    default: mod.default,
  })),
  {
    ssr: false,
    loading: () => (
      <ComponentLoadingFallback
        text="Loading debug panel..."
        variant="pulse"
      />
    ),
  },
)

export const LazyConfigPanel = dynamic(
  () => import('@/app/configuration').then(mod => ({
    default: mod.default,
  })),
  {
    ssr: false,
    loading: () => (
      <ComponentLoadingFallback
        text="Loading configuration..."
        variant="skeleton"
        size="lg"
      />
    ),
  },
)

/**
 * Progressive loading hook for heavy components
 */
export const useProgressiveLoading = (
  shouldLoad: boolean,
  delay = 0,
) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    if (shouldLoad && !isLoaded) {
      setIsLoading(true)

      const timer = setTimeout(() => {
        setIsLoaded(true)
        setIsLoading(false)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [shouldLoad, isLoaded, delay])

  return { isLoading, isLoaded }
}

/**
 * Intersection observer hook for lazy loading on scroll
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {},
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false)
  const [hasIntersected, setHasIntersected] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element)
      return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      if (entry.isIntersecting && !hasIntersected)
        setHasIntersected(true)
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    })

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [hasIntersected, options])

  return { ref, isIntersecting, hasIntersected }
}

/**
 * Lazy container component with intersection observer
 */
export const LazyContainer: React.FC<{
  children: React.ReactNode
  fallback?: React.ReactNode
  rootMargin?: string
  threshold?: number
  once?: boolean
}> = ({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.1,
  once = true,
}) => {
  const { ref, hasIntersected } = useIntersectionObserver({
    rootMargin,
    threshold,
  })

  const shouldRender = once ? hasIntersected : hasIntersected

  return (
    <div ref={ref}>
      {shouldRender
        ? (
          children
        )
        : (
          fallback || <ComponentLoadingFallback variant="skeleton" />
        )}
    </div>
  )
}

/**
 * Bundle size monitoring (development only)
 */
export const useBundleMonitoring = () => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor dynamic imports
      const originalImport = window.import || (() => {})

      window.import = async (...args) => {
        const start = performance.now()
        const result = await originalImport(...args)
        const end = performance.now()

        console.debug(`Dynamic import took ${end - start}ms:`, args[0])
        return result
      }
    }
  }, [])
}

export default {
  LazyMonacoEditor,
  LazyPromptEditor,
  LazyEChartsReact,
  LazyReactFlow,
  LazyPdfHighlighter,
  LazyCanvas,
  LazyFileUploader,
  LazyImageUploader,
  LazyDebugPanel,
  LazyConfigPanel,
  withLazyLoading,
  useProgressiveLoading,
  useIntersectionObserver,
  LazyContainer,
  useBundleMonitoring,
}
