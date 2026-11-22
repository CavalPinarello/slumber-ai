// Modern conversation hook using Zustand store
// Re-export the new implementation while maintaining backward compatibility

// For components that haven't been migrated yet, provide the legacy implementation
import useConversationLegacy from './use-conversation-legacy'

// Default export is the new implementation
import { useConversation as newUseConversation } from '@/stores/conversation-store'

export { useConversation, useConversationStore, useConversationSelectors } from '@/stores/conversation-store'

/**
 * @deprecated Use the new conversation store from stores/conversation-store.ts
 * This is kept for backward compatibility during migration
 */
export const useConversationLegacy = useConversationLegacy
export default newUseConversation
