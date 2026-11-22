// Virtual list implementation for large conversation lists and message history

import React from 'react'
import { memoWithShallowCompare } from '@/components/performance/memoization'

/**
 * Virtual list item interface
 */
export type VirtualListItem = {
  id: string | number
  height?: number
  data?: any
}

/**
 * Virtual list configuration
 */
export type VirtualListConfig = {
  itemHeight: number | ((index: number, item: VirtualListItem) => number)
  containerHeight: number
  overscan?: number
  scrollingDelay?: number
  estimateSize?: (index: number) => number
}

/**
 * Virtual list hook for performance optimization
 */
export const useVirtualList = <T extends VirtualListItem>(
  items: T[],
  config: VirtualListConfig,
) => {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    scrollingDelay = 150,
  } = config

  const [scrollTop, setScrollTop] = React.useState(0)
  const [isScrolling, setIsScrolling] = React.useState(false)
  const scrollingTimeoutRef = React.useRef<NodeJS.Timeout>()

  // Calculate item positions and heights
  const itemPositions = React.useMemo(() => {
    const positions: { top: number; height: number }[] = []
    let currentTop = 0

    for (let i = 0; i < items.length; i++) {
      const height = typeof itemHeight === 'function'
        ? itemHeight(i, items[i])
        : itemHeight

      positions.push({
        top: currentTop,
        height,
      })

      currentTop += height
    }

    return positions
  }, [items, itemHeight])

  // Calculate total height
  const totalHeight = React.useMemo(() => {
    return itemPositions.length > 0
      ? itemPositions[itemPositions.length - 1].top + itemPositions[itemPositions.length - 1].height
      : 0
  }, [itemPositions])

  // Calculate visible range
  const visibleRange = React.useMemo(() => {
    if (itemPositions.length === 0)
      return { startIndex: 0, endIndex: 0, items: [] }

    // Binary search for start index
    let startIndex = 0
    let endIndex = itemPositions.length - 1

    while (startIndex <= endIndex) {
      const midIndex = Math.floor((startIndex + endIndex) / 2)
      const position = itemPositions[midIndex]

      if (position.top <= scrollTop)
        startIndex = midIndex + 1
      else
        endIndex = midIndex - 1
    }

    startIndex = Math.max(0, endIndex - overscan)

    // Find end index
    const visibleBottom = scrollTop + containerHeight
    let visibleEndIndex = startIndex

    while (
      visibleEndIndex < itemPositions.length
      && itemPositions[visibleEndIndex].top < visibleBottom
    ) {
      visibleEndIndex++
    }

    visibleEndIndex = Math.min(
      itemPositions.length - 1,
      visibleEndIndex + overscan,
    )

    return {
      startIndex,
      endIndex: visibleEndIndex,
      items: items.slice(startIndex, visibleEndIndex + 1),
    }
  }, [itemPositions, scrollTop, containerHeight, overscan, items])

  // Handle scroll with debouncing
  const handleScroll = React.useCallback((event: React.UIEvent<HTMLElement>) => {
    const newScrollTop = event.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    setIsScrolling(true)

    // Clear existing timeout
    if (scrollingTimeoutRef.current)
      clearTimeout(scrollingTimeoutRef.current)

    // Set scrolling to false after delay
    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, scrollingDelay)
  }, [scrollingDelay])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (scrollingTimeoutRef.current)
        clearTimeout(scrollingTimeoutRef.current)
    }
  }, [])

  return {
    ...visibleRange,
    totalHeight,
    scrollTop,
    isScrolling,
    onScroll: handleScroll,
    getItemOffset: (index: number) => itemPositions[index]?.top || 0,
    getItemHeight: (index: number) => itemPositions[index]?.height || 0,
  }
}

/**
 * Virtual list component
 */
export type VirtualListProps<T extends VirtualListItem> = {
  items: T[]
  height: number
  itemHeight: number | ((index: number, item: T) => number)
  renderItem: (item: T, index: number, isScrolling: boolean) => React.ReactNode
  className?: string
  overscan?: number
  onScroll?: (scrollTop: number) => void
  estimateSize?: (index: number) => number
  getItemKey?: (item: T, index: number) => string | number
}

export const VirtualList = memoWithShallowCompare(<T extends VirtualListItem>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  getItemKey,
}: VirtualListProps<T>) => {
  const {
    startIndex,
    endIndex,
    items: visibleItems,
    totalHeight,
    isScrolling,
    onScroll: handleScroll,
    getItemOffset,
  } = useVirtualList(items, {
    itemHeight,
    containerHeight: height,
    overscan,
  })

  const handleScrollEvent = React.useCallback((event: React.UIEvent<HTMLElement>) => {
    handleScroll(event)
    onScroll?.(event.currentTarget.scrollTop)
  }, [handleScroll, onScroll])

  return (
    <div
      className={`overflow-auto ${className || ''}`}
      style={{ height }}
      onScroll={handleScrollEvent}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, relativeIndex) => {
          const absoluteIndex = startIndex + relativeIndex
          const key = getItemKey ? getItemKey(item, absoluteIndex) : item.id
          const offset = getItemOffset(absoluteIndex)

          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: offset,
                left: 0,
                right: 0,
              }}
            >
              {renderItem(item, absoluteIndex, isScrolling)}
            </div>
          )
        })}
      </div>
    </div>
  )
})

/**
 * Virtual conversation list component
 */
export type VirtualConversationListProps = {
  conversations: Array<{
    id: string
    name: string
    message_count: number
    updated_at: string
  }>
  height: number
  onConversationClick: (conversation: any) => void
  selectedConversationId?: string
  className?: string
}

export const VirtualConversationList = memoWithShallowCompare(({
  conversations,
  height,
  onConversationClick,
  selectedConversationId,
  className,
}: VirtualConversationListProps) => {
  const renderConversation = React.useCallback((conversation: any, index: number, isScrolling: boolean) => {
    const isSelected = conversation.id === selectedConversationId

    return (
      <div
        className={`
          p-4 border-b border-divider-subtle cursor-pointer transition-colors
          ${isSelected ? 'bg-primary-50 border-primary-200' : 'hover:bg-background-secondary'}
          ${isScrolling ? 'pointer-events-none' : ''}
        `}
        onClick={() => !isScrolling && onConversationClick(conversation)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-text-primary truncate">
              {conversation.name}
            </h3>
            <p className="text-xs text-text-secondary">
              {conversation.message_count} messages
            </p>
          </div>
          <div className="text-xs text-text-tertiary">
            {new Date(conversation.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    )
  }, [onConversationClick, selectedConversationId])

  return (
    <VirtualList
      items={conversations.map(conv => ({ ...conv, id: conv.id }))}
      height={height}
      itemHeight={80} // Fixed height for conversation items
      renderItem={renderConversation}
      className={className}
      getItemKey={item => item.id}
    />
  )
})

/**
 * Virtual message list component
 */
export type VirtualMessageListProps = {
  messages: Array<{
    id: string
    content: string
    message_type: 'question' | 'answer'
    created_at: string
  }>
  height: number
  className?: string
  estimateMessageHeight?: (message: any) => number
}

export const VirtualMessageList = memoWithShallowCompare(({
  messages,
  height,
  className,
  estimateMessageHeight,
}: VirtualMessageListProps) => {
  const getMessageHeight = React.useCallback((index: number, message: any) => {
    if (estimateMessageHeight)
      return estimateMessageHeight(message)

    // Estimate based on content length
    const baseHeight = 60 // Base height for message container
    const contentHeight = Math.ceil(message.content.length / 80) * 20 // Rough estimation
    return Math.max(baseHeight, baseHeight + contentHeight)
  }, [estimateMessageHeight])

  const renderMessage = React.useCallback((message: any, index: number, isScrolling: boolean) => {
    const isQuestion = message.message_type === 'question'

    return (
      <div className={`p-4 ${isQuestion ? 'bg-background-secondary' : 'bg-background-default'}`}>
        <div className={`flex ${isQuestion ? 'justify-end' : 'justify-start'}`}>
          <div className={`
            max-w-3xl p-3 rounded-lg
            ${isQuestion
        ? 'bg-primary-500 text-white'
        : 'bg-background-tertiary text-text-primary'
      }
          `}>
            <div className="text-sm whitespace-pre-wrap">
              {isScrolling ? (
                // Show skeleton while scrolling for performance
                <div className="animate-pulse">
                  <div className="h-4 bg-current opacity-20 rounded mb-2" />
                  <div className="h-4 bg-current opacity-20 rounded w-3/4" />
                </div>
              ) : (
                message.content
              )}
            </div>
            <div className="text-xs opacity-70 mt-2">
              {new Date(message.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    )
  }, [])

  return (
    <VirtualList
      items={messages.map(msg => ({ ...msg, id: msg.id }))}
      height={height}
      itemHeight={getMessageHeight}
      renderItem={renderMessage}
      className={className}
      getItemKey={item => item.id}
      overscan={10} // Higher overscan for smoother scrolling
    />
  )
})

/**
 * Infinite scroll hook for virtual lists
 */
export const useInfiniteVirtualList = <T extends VirtualListItem>(
  loadMore: () => Promise<T[]>,
  hasMore: boolean,
  threshold = 100,
) => {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const handleScroll = React.useCallback(async (scrollTop: number, containerHeight: number, totalHeight: number) => {
    const distanceFromBottom = totalHeight - (scrollTop + containerHeight)

    if (distanceFromBottom < threshold && hasMore && !loading) {
      setLoading(true)
      setError(null)

      try {
        await loadMore()
      }
      catch (err) {
        setError(err as Error)
      }
      finally {
        setLoading(false)
      }
    }
  }, [loadMore, hasMore, loading, threshold])

  return {
    loading,
    error,
    handleScroll,
  }
}

/**
 * Performance monitoring for virtual lists
 */
export const useVirtualListPerformance = (name: string) => {
  const renderCount = React.useRef(0)
  const scrollCount = React.useRef(0)

  renderCount.current++

  const trackScroll = React.useCallback(() => {
    scrollCount.current++

    if (process.env.NODE_ENV === 'development' && scrollCount.current % 100 === 0)
      console.debug(`${name}: ${scrollCount.current} scroll events, ${renderCount.current} renders`)
  }, [name])

  return { trackScroll }
}

export default {
  VirtualList,
  VirtualConversationList,
  VirtualMessageList,
  useVirtualList,
  useInfiniteVirtualList,
  useVirtualListPerformance,
}
