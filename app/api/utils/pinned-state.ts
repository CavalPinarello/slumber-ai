// Storage key for pinned conversations
const PINNED_CONVERSATIONS_KEY = 'pinned_conversations'

// Get pinned conversations from localStorage
const getPinnedConversationsFromStorage = (): Set<string> => {
  if (typeof window === 'undefined')
    return new Set()

  try {
    const stored = localStorage.getItem(PINNED_CONVERSATIONS_KEY)
    if (stored) {
      const parsedArray = JSON.parse(stored)
      return new Set(Array.isArray(parsedArray) ? parsedArray : [])
    }
  }
  catch (error) {
    console.warn('Failed to parse pinned conversations from localStorage:', error)
  }
  return new Set()
}

// Save pinned conversations to localStorage
const savePinnedConversationsToStorage = (pinnedConversations: Set<string>) => {
  if (typeof window === 'undefined')
    return

  try {
    localStorage.setItem(PINNED_CONVERSATIONS_KEY, JSON.stringify(Array.from(pinnedConversations)))
  }
  catch (error) {
    console.warn('Failed to save pinned conversations to localStorage:', error)
  }
}

// Initialize pinned conversations from localStorage
export const pinnedConversations = getPinnedConversationsFromStorage()

export const addPinnedConversation = (conversationId: string) => {
  pinnedConversations.add(conversationId)
  savePinnedConversationsToStorage(pinnedConversations)
  console.log('Added conversation to pinned list:', conversationId, 'Total pinned:', pinnedConversations.size)
}

export const removePinnedConversation = (conversationId: string) => {
  pinnedConversations.delete(conversationId)
  savePinnedConversationsToStorage(pinnedConversations)
  console.log('Removed conversation from pinned list:', conversationId, 'Total pinned:', pinnedConversations.size)
}

export const isPinnedConversation = (conversationId: string) => {
  return pinnedConversations.has(conversationId)
}

// Get all pinned conversation IDs as array
export const getAllPinnedConversationIds = (): string[] => {
  return Array.from(pinnedConversations)
}
