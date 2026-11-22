// Legacy conversation hook - kept for backward compatibility during migration
// This file maintains the original useConversation implementation
// TODO: Gradually migrate components to use the new Zustand store

import { useState } from 'react'
import produce from 'immer'
import { useGetState } from 'ahooks'
import type { ConversationItem } from '@/types/app'

const storageConversationIdKey = 'conversationIdInfo'

type ConversationInfoType = Omit<ConversationItem, 'inputs' | 'id'>

/**
 * @deprecated Use the new conversation store from stores/conversation-store.ts
 * This hook is kept for backward compatibility during migration
 */
function useConversationLegacy() {
  const [conversationList, setConversationList] = useState<ConversationItem[]>([])
  const [currConversationId, doSetCurrConversationId, getCurrConversationId] = useGetState<string>('-1')

  // when set conversation id, we do not have set appId
  const setCurrConversationId = (id: string, appId: string, isSetToLocalStroge = true, newConversationName = '') => {
    doSetCurrConversationId(id)
    if (isSetToLocalStroge && id !== '-1') {
      // conversationIdInfo: {[appId1]: conversationId1, [appId2]: conversationId2}
      const storageValue = globalThis.localStorage?.getItem(storageConversationIdKey)
      const conversationIdInfo = storageValue ? JSON.parse(storageValue) : {}
      conversationIdInfo[appId] = id
      globalThis.localStorage?.setItem(storageConversationIdKey, JSON.stringify(conversationIdInfo))
    }
  }

  const getConversationIdFromStorage = (appId: string) => {
    const storageValue = globalThis.localStorage?.getItem(storageConversationIdKey)
    const conversationIdInfo = storageValue ? JSON.parse(storageValue) : {}
    const id = conversationIdInfo[appId]
    return id
  }

  const isNewConversation = currConversationId === '-1'
  // input can be updated by user
  const [newConversationInputs, setNewConversationInputs] = useState<Record<string, any> | null>(null)
  const resetNewConversationInputs = () => {
    if (!newConversationInputs)
      return
    setNewConversationInputs(produce(newConversationInputs, (draft) => {
      Object.keys(draft).forEach((key) => {
        draft[key] = ''
      })
    }))
  }
  const [existConversationInputs, setExistConversationInputs] = useState<Record<string, any> | null>(null)
  const currInputs = isNewConversation ? newConversationInputs : existConversationInputs
  const setCurrInputs = isNewConversation ? setNewConversationInputs : setExistConversationInputs

  // info is muted
  const [newConversationInfo, setNewConversationInfo] = useState<ConversationInfoType | null>(null)
  const [existConversationInfo, setExistConversationInfo] = useState<ConversationInfoType | null>(null)
  const currConversationInfo = isNewConversation ? newConversationInfo : existConversationInfo
  const setCurrConversationInfo = isNewConversation ? setNewConversationInfo : setExistConversationInfo

  return {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,

    isNewConversation,

    newConversationInputs,
    setNewConversationInputs,
    resetNewConversationInputs,

    existConversationInputs,
    setExistConversationInputs,

    currInputs,
    setCurrInputs,

    newConversationInfo,
    setNewConversationInfo,

    existConversationInfo,
    setExistConversationInfo,

    currConversationInfo,
    setCurrConversationInfo,
  }
}

export default useConversationLegacy
