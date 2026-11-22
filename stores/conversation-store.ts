import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { ConversationItem } from '@/types/chat'

type ConversationInfoType = Omit<ConversationItem, 'inputs' | 'id'>

type ConversationState = {
  // Core state
  conversationList: ConversationItem[]
  currentConversationId: string

  // Input states
  newConversationInputs: Record<string, any> | null
  existConversationInputs: Record<string, any> | null

  // Info states
  newConversationInfo: ConversationInfoType | null
  existConversationInfo: ConversationInfoType | null

  // Derived state getters
  isNewConversation: boolean
  currentInputs: Record<string, any> | null
  currentConversationInfo: ConversationInfoType | null
  currentConversation: ConversationItem | null
}

type ConversationActions = {
  // Conversation management
  setConversationList: (conversations: ConversationItem[]) => void
  addConversation: (conversation: ConversationItem) => void
  updateConversation: (id: string, updates: Partial<ConversationItem>) => void
  removeConversation: (id: string) => void

  // Current conversation management
  setCurrentConversationId: (id: string, appId?: string, saveToStorage?: boolean) => void
  getConversationIdFromStorage: (appId: string) => string | null

  // Input management
  setNewConversationInputs: (inputs: Record<string, any> | null) => void
  setExistConversationInputs: (inputs: Record<string, any> | null) => void
  resetNewConversationInputs: () => void
  updateCurrentInputs: (updates: Record<string, any>) => void

  // Info management
  setNewConversationInfo: (info: ConversationInfoType | null) => void
  setExistConversationInfo: (info: ConversationInfoType | null) => void

  // Utility actions
  reset: () => void
  clearCurrentConversation: () => void
}

const STORAGE_KEY = 'conversationIdInfo'

const initialState: ConversationState = {
  conversationList: [],
  currentConversationId: '-1',
  newConversationInputs: null,
  existConversationInputs: null,
  newConversationInfo: null,
  existConversationInfo: null,
  isNewConversation: true,
  currentInputs: null,
  currentConversationInfo: null,
  currentConversation: null,
}

export const useConversationStore = create<ConversationState & ConversationActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // Conversation management
        setConversationList: (conversations) => {
          set((state) => {
            state.conversationList = conversations
          })
        },

        addConversation: (conversation) => {
          set((state) => {
            state.conversationList.unshift(conversation)
          })
        },

        updateConversation: (id, updates) => {
          set((state) => {
            const index = state.conversationList.findIndex(conv => conv.id === id)
            if (index !== -1)
              Object.assign(state.conversationList[index], updates)
          })
        },

        removeConversation: (id) => {
          set((state) => {
            state.conversationList = state.conversationList.filter(conv => conv.id !== id)
          })
        },

        // Current conversation management
        setCurrentConversationId: (id, appId, saveToStorage = true) => {
          set((state) => {
            state.currentConversationId = id
            state.isNewConversation = id === '-1'

            // Update derived state
            const isNew = id === '-1'
            state.currentInputs = isNew ? state.newConversationInputs : state.existConversationInputs
            state.currentConversationInfo = isNew ? state.newConversationInfo : state.existConversationInfo
            state.currentConversation = isNew
              ? null
              : state.conversationList.find(conv => conv.id === id) || null
          })

          // Save to localStorage
          if (saveToStorage && id !== '-1' && appId && typeof window !== 'undefined') {
            try {
              const storageValue = localStorage.getItem(STORAGE_KEY)
              const conversationIdInfo = storageValue ? JSON.parse(storageValue) : {}
              conversationIdInfo[appId] = id
              localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationIdInfo))
            }
            catch (error) {
              console.error('Failed to save conversation ID to storage:', error)
            }
          }
        },

        getConversationIdFromStorage: (appId) => {
          if (typeof window === 'undefined')
            return null

          try {
            const storageValue = localStorage.getItem(STORAGE_KEY)
            const conversationIdInfo = storageValue ? JSON.parse(storageValue) : {}
            return conversationIdInfo[appId] || null
          }
          catch (error) {
            console.error('Failed to get conversation ID from storage:', error)
            return null
          }
        },

        // Input management
        setNewConversationInputs: (inputs) => {
          set((state) => {
            if (state) {
              state.newConversationInputs = inputs
              if (state.isNewConversation)
                state.currentInputs = inputs
            }
          })
        },

        setExistConversationInputs: (inputs) => {
          set((state) => {
            if (state) {
              state.existConversationInputs = inputs
              if (!state.isNewConversation)
                state.currentInputs = inputs
            }
          })
        },

        resetNewConversationInputs: () => {
          set((state) => {
            if (state.newConversationInputs) {
              const resetInputs = { ...state.newConversationInputs }
              Object.keys(resetInputs).forEach((key) => {
                resetInputs[key] = ''
              })
              state.newConversationInputs = resetInputs
              if (state.isNewConversation)
                state.currentInputs = resetInputs
            }
          })
        },

        updateCurrentInputs: (updates) => {
          set((state) => {
            if (!state || !updates) return
            
            if (state.isNewConversation && state.newConversationInputs) {
              Object.assign(state.newConversationInputs, updates)
              state.currentInputs = state.newConversationInputs
            }
            else if (!state.isNewConversation && state.existConversationInputs) {
              Object.assign(state.existConversationInputs, updates)
              state.currentInputs = state.existConversationInputs
            }
          })
        },

        // Info management
        setNewConversationInfo: (info) => {
          set((state) => {
            state.newConversationInfo = info
            if (state.isNewConversation)
              state.currentConversationInfo = info
          })
        },

        setExistConversationInfo: (info) => {
          set((state) => {
            state.existConversationInfo = info
            if (!state.isNewConversation)
              state.currentConversationInfo = info
          })
        },

        // Utility actions
        reset: () => {
          set(() => ({ ...initialState }))
        },

        clearCurrentConversation: () => {
          set((state) => {
            state.currentConversationId = '-1'
            state.isNewConversation = true
            state.currentInputs = state.newConversationInputs
            state.currentConversationInfo = state.newConversationInfo
            state.currentConversation = null
          })
        },
      })),
      {
        name: 'conversation-store',
        partialize: state => ({
          // Only persist essential state
          currentConversationId: state.currentConversationId,
        }),
      },
    ),
  ),
)

// Selectors for commonly used state combinations
export const useConversationSelectors = () => ({
  // Basic selectors
  conversationList: useConversationStore(state => state.conversationList),
  currentConversationId: useConversationStore(state => state.currentConversationId),
  isNewConversation: useConversationStore(state => state.isNewConversation),
  currentInputs: useConversationStore(state => state.currentInputs),
  currentConversationInfo: useConversationStore(state => state.currentConversationInfo),
  currentConversation: useConversationStore(state => state.currentConversation),

  // Action selectors
  setCurrentConversationId: useConversationStore(state => state.setCurrentConversationId),
  updateCurrentInputs: useConversationStore(state => state.updateCurrentInputs),
  resetNewConversationInputs: useConversationStore(state => state.resetNewConversationInputs),
  clearCurrentConversation: useConversationStore(state => state.clearCurrentConversation),
})

// Backward compatibility hook that mimics the original useConversation interface
export const useConversation = () => {
  const store = useConversationStore()

  return {
    // State
    conversationList: store.conversationList,
    currConversationId: store.currentConversationId,
    getCurrConversationId: () => store.currentConversationId,
    isNewConversation: store.isNewConversation,
    newConversationInputs: store.newConversationInputs,
    existConversationInputs: store.existConversationInputs,
    currInputs: store.currentInputs,
    newConversationInfo: store.newConversationInfo,
    existConversationInfo: store.existConversationInfo,
    currConversationInfo: store.currentConversationInfo,

    // Actions
    setConversationList: store.setConversationList,
    setCurrConversationId: store.setCurrentConversationId,
    getConversationIdFromStorage: store.getConversationIdFromStorage,
    setNewConversationInputs: store.setNewConversationInputs,
    setExistConversationInputs: store.setExistConversationInputs,
    setCurrInputs: (inputs: Record<string, any> | null) => {
      // Dynamically determine which setter to use based on current state
      const currentStore = useConversationStore.getState()
      if (currentStore.isNewConversation) {
        currentStore.setNewConversationInputs(inputs)
      } else {
        currentStore.setExistConversationInputs(inputs)
      }
    },
    resetNewConversationInputs: store.resetNewConversationInputs,
    setNewConversationInfo: store.setNewConversationInfo,
    setExistConversationInfo: store.setExistConversationInfo,

    // Utility
    reset: store.reset,
  }
}

export default useConversationStore
