import { useCallback, useEffect, useState } from 'react'

const PINNED_CONVERSATIONS_KEY = 'pinned_conversations'

// Get pinned conversations from localStorage
const getPinnedConversationsFromStorage = (): string[] => {
  if (typeof window === 'undefined')
    return []

  try {
    const stored = localStorage.getItem(PINNED_CONVERSATIONS_KEY)
    if (stored) {
      const parsedArray = JSON.parse(stored)
      return Array.isArray(parsedArray) ? parsedArray : []
    }
  }
  catch (error) {
    console.warn('Failed to parse pinned conversations from localStorage:', error)
  }
  return []
}

// Save pinned conversations to localStorage
const savePinnedConversationsToStorage = (pinnedConversations: string[]) => {
  if (typeof window === 'undefined')
    return

  try {
    localStorage.setItem(PINNED_CONVERSATIONS_KEY, JSON.stringify(pinnedConversations))
  }
  catch (error) {
    console.warn('Failed to save pinned conversations to localStorage:', error)
  }
}

export const usePinnedConversations = () => {
  const [pinnedConversationIds, setPinnedConversationIds] = useState<string[]>([])

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = getPinnedConversationsFromStorage()
    setPinnedConversationIds(stored)
    console.log('Initialized pinned conversations from localStorage:', stored)
  }, [])

  const addPinnedConversation = useCallback((conversationId: string) => {
    setPinnedConversationIds((prev) => {
      if (prev.includes(conversationId))
        return prev // Already pinned

      const updated = [...prev, conversationId]
      savePinnedConversationsToStorage(updated)
      console.log('Added conversation to pinned list:', conversationId, 'Total pinned:', updated.length)
      return updated
    })
  }, [])

  const removePinnedConversation = useCallback((conversationId: string) => {
    setPinnedConversationIds((prev) => {
      const updated = prev.filter(id => id !== conversationId)
      savePinnedConversationsToStorage(updated)
      console.log('Removed conversation from pinned list:', conversationId, 'Total pinned:', updated.length)
      return updated
    })
  }, [])

  const isPinnedConversation = useCallback((conversationId: string) => {
    return pinnedConversationIds.includes(conversationId)
  }, [pinnedConversationIds])

  const togglePinnedConversation = useCallback((conversationId: string) => {
    if (isPinnedConversation(conversationId))
      removePinnedConversation(conversationId)
    else
      addPinnedConversation(conversationId)
  }, [isPinnedConversation, addPinnedConversation, removePinnedConversation])

  // Clean up non-existent conversations from pinned list
  const cleanupPinnedConversations = useCallback((existingConversationIds: string[]) => {
    const currentPinned = getPinnedConversationsFromStorage()
    const validPinned = currentPinned.filter(id => existingConversationIds.includes(id))

    if (validPinned.length !== currentPinned.length) {
      const removedIds = currentPinned.filter(id => !existingConversationIds.includes(id))
      console.log('Cleaning up non-existent pinned conversations:', removedIds)
      setPinnedConversationIds(validPinned)
      savePinnedConversationsToStorage(validPinned)
    }
  }, [])

  return {
    pinnedConversationIds,
    addPinnedConversation,
    removePinnedConversation,
    isPinnedConversation,
    togglePinnedConversation,
    cleanupPinnedConversations,
  }
}
