import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { useLocalStorageState } from 'ahooks'
import produce from 'immer'
import { noop } from 'lodash-es'
import type {
  Callback,
  ChatConfig,
  ChatItem,
  Feedback,
} from '../types'
import { CONVERSATION_ID_INFO } from '../constants'
import { buildChatItemTree, getProcessedSystemVariablesFromUrlParams, getRawInputsFromUrlParams } from '../utils'
import { addFileInfos, sortAgentSorts } from '@/app/components/tools/utils'
import { getProcessedFilesFromResponse } from '@/app/components/base/file-uploader/utils'
import {
  delConversation,
  fetchAppInfo,
  fetchAppMeta,
  fetchAppParams,
  fetchChatList,
  fetchConversations,
  generationConversationName,
  pinConversation,
  renameConversation,
  unpinConversation,
  updateFeedback,
} from '@/service/share'
import type { InstalledApp } from '@/models/explore'
import type {
  AppData,
  ConversationItem,
} from '@/models/share'
import { useToastContext } from '@/app/components/base/toast'
import { changeLanguage } from '@/i18n/i18next-config'
import { useAppFavicon } from '@/hooks/use-app-favicon'
import { usePinnedConversations } from '@/hooks/use-pinned-conversations'
import { InputVarType } from '@/app/components/workflow/types'
import { TransferMethod } from '@/types/app'
import { useGetUserCanAccessApp } from '@/service/access-control'
import { useGlobalPublicStore } from '@/context/global-public-context'

function getFormattedChatList(messages: any[]) {
  const newChatList: ChatItem[] = []
  messages.forEach((item) => {
    const questionFiles = item.message_files?.filter((file: any) => file.belongs_to === 'user') || []
    newChatList.push({
      id: `question-${item.id}`,
      content: item.query,
      isAnswer: false,
      message_files: getProcessedFilesFromResponse(questionFiles.map((item: any) => ({ ...item, related_id: item.id, upload_file_id: item.upload_file_id }))),
      parentMessageId: item.parent_message_id || undefined,
    })
    const answerFiles = item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || []
    newChatList.push({
      id: item.id,
      content: item.answer,
      agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
      feedback: item.feedback,
      isAnswer: true,
      citation: item.retriever_resources,
      message_files: getProcessedFilesFromResponse(answerFiles.map((item: any) => ({ ...item, related_id: item.id, upload_file_id: item.upload_file_id }))),
      parentMessageId: `question-${item.id}`,
    })
  })
  return newChatList
}

export const useChatWithHistory = (installedAppInfo?: InstalledApp) => {
  const isInstalledApp = false // Use direct Dify API (more stable, but no character streaming)
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)

  // Use pinned conversations hook for client-side state management
  const {
    pinnedConversationIds,
    addPinnedConversation: addToPinnedList,
    removePinnedConversation: removeFromPinnedList,
    isPinnedConversation,
    cleanupPinnedConversations,
  } = usePinnedConversations()
  const { data: appInfo, isLoading: appInfoLoading, error: appInfoError, mutate: mutateAppInfo } = useSWR(
    installedAppInfo ? null : 'appInfo',
    fetchAppInfo,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
    },
  )

  const { isPending: isCheckingPermission, data: userCanAccessResult } = useGetUserCanAccessApp({
    appId: installedAppInfo?.app.id || appInfo?.app_id,
    isInstalledApp,
    enabled: systemFeatures.webapp_auth.enabled,
  })

  useAppFavicon({
    enable: !installedAppInfo,
    icon_type: appInfo?.site.icon_type,
    icon: appInfo?.site.icon,
    icon_background: appInfo?.site.icon_background,
    icon_url: appInfo?.site.icon_url,
  })

  const appData = useMemo(() => {
    if (isInstalledApp && installedAppInfo) {
      const { id, app } = installedAppInfo
      return {
        app_id: id,
        site: {
          title: app.name,
          description: app.description,
          icon_type: app.icon_type,
          icon: app.icon,
          icon_background: app.icon_background,
          icon_url: app.icon_url,
          prompt_public: false,
          copyright: '',
          show_workflow_steps: true,
          use_icon_as_answer_icon: app.use_icon_as_answer_icon,
        },
        plan: 'basic',
      } as AppData
    }

    return appInfo
  }, [isInstalledApp, installedAppInfo, appInfo])
  const appId = useMemo(() => appData?.app_id, [appData])

  const [userId, setUserId] = useState<string>()
  useEffect(() => {
    getProcessedSystemVariablesFromUrlParams().then(({ user_id }) => {
      setUserId(user_id)
    })
  }, [])

  useEffect(() => {
    if (appData?.site.default_language)
      changeLanguage(appData.site.default_language)
  }, [appData])

  const [sidebarCollapseState, setSidebarCollapseState] = useState<boolean>(false)
  const handleSidebarCollapse = useCallback((state: boolean) => {
    if (appId) {
      setSidebarCollapseState(state)
      localStorage.setItem('webappSidebarCollapse', state ? 'collapsed' : 'expanded')
    }
  }, [appId, setSidebarCollapseState])
  useEffect(() => {
    if (appId) {
      const localState = localStorage.getItem('webappSidebarCollapse')
      setSidebarCollapseState(localState === 'collapsed')
    }
  }, [appId])
  const [conversationIdInfo, setConversationIdInfo] = useLocalStorageState<Record<string, Record<string, string>>>(CONVERSATION_ID_INFO, {
    defaultValue: {},
  })
  const currentConversationId = useMemo(() => conversationIdInfo?.[appId || '']?.[userId || 'DEFAULT'] || '', [appId, conversationIdInfo, userId])
  const handleConversationIdInfoChange = useCallback((changeConversationId: string) => {
    if (appId) {
      let prevValue = conversationIdInfo?.[appId || '']
      if (typeof prevValue === 'string')
        prevValue = {}
      setConversationIdInfo({
        ...conversationIdInfo,
        [appId || '']: {
          ...prevValue,
          [userId || 'DEFAULT']: changeConversationId,
        },
      })
    }
  }, [appId, conversationIdInfo, setConversationIdInfo, userId])

  const [newConversationId, setNewConversationId] = useState('')
  const chatShouldReloadKey = useMemo(() => {
    if (currentConversationId === newConversationId)
      return ''

    return currentConversationId
  }, [currentConversationId, newConversationId])

  const { data: appParams } = useSWR(['appParams', isInstalledApp, appId], () => fetchAppParams(isInstalledApp, appId), {
    onError: (error) => {
      // Log error for debugging but don't show toast for initial load failures
      console.log('App parameters fetch failed (non-critical):', error)
    },
  })
  const { data: appMeta } = useSWR(['appMeta', isInstalledApp, appId], () => fetchAppMeta(isInstalledApp, appId))
  const { data: appConversationData, isLoading: appConversationDataLoading, mutate: mutateAppConversationData } = useSWR(['appConversationData', isInstalledApp, appId], () => fetchConversations(isInstalledApp, appId, undefined, undefined, 100))
  const { data: appChatListData, isLoading: appChatListDataLoading, error: appChatListError } = useSWR(
    chatShouldReloadKey && chatShouldReloadKey !== '' ? ['appChatList', chatShouldReloadKey, isInstalledApp, appId] : null,
    () => fetchChatList(chatShouldReloadKey, isInstalledApp, appId),
  )

  const [clearChatList, setClearChatList] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const appPrevChatTree = useMemo(
    () => (currentConversationId && appChatListData?.data.length)
      ? buildChatItemTree(getFormattedChatList(appChatListData.data))
      : [],
    [appChatListData, currentConversationId],
  )

  const [showNewConversationItemInList, setShowNewConversationItemInList] = useState(false)

  const pinnedConversationList = useMemo(() => {
    const allConversations = appConversationData?.data || []
    const pinnedList = allConversations.filter(conv => isPinnedConversation(conv.id))
    console.log('Pinned conversation list:', pinnedList, 'from IDs:', pinnedConversationIds)
    return pinnedList
  }, [appConversationData, pinnedConversationIds, isPinnedConversation])
  const { t } = useTranslation()
  const newConversationInputsRef = useRef<Record<string, any> | null>({})
  const [newConversationInputs, setNewConversationInputs] = useState<Record<string, any>>({})
  const [initInputs, setInitInputs] = useState<Record<string, any>>({})
  const handleNewConversationInputsChange = useCallback((newInputs: Record<string, any>) => {
    if (newConversationInputsRef?.current !== null && newConversationInputsRef?.current !== undefined) {
      newConversationInputsRef.current = newInputs
    }
    setNewConversationInputs(newInputs)
  }, [])
  const inputsForms = useMemo(() => {
    // If appParams is undefined (API call failed), default to empty array
    if (!appParams) {
      console.log('appParams is undefined, defaulting inputsForms to empty array')
      return []
    }
    return (appParams?.user_input_form || []).filter((item: any) => !item.external_data_tool).map((item: any) => {
      if (item.paragraph) {
        let value = initInputs[item.paragraph.variable]
        if (value && item.paragraph.max_length && value.length > item.paragraph.max_length)
          value = value.slice(0, item.paragraph.max_length)

        return {
          ...item.paragraph,
          default: value || item.default,
          type: 'paragraph',
        }
      }
      if (item.number) {
        const convertedNumber = Number(initInputs[item.number.variable]) ?? undefined
        return {
          ...item.number,
          default: convertedNumber || item.default,
          type: 'number',
        }
      }
      if (item.select) {
        const isInputInOptions = item.select.options.includes(initInputs[item.select.variable])
        return {
          ...item.select,
          default: (isInputInOptions ? initInputs[item.select.variable] : undefined) || item.default,
          type: 'select',
        }
      }

      if (item['file-list']) {
        return {
          ...item['file-list'],
          type: InputVarType.multiFiles,
        }
      }

      if (item.file) {
        return {
          ...item.file,
          type: InputVarType.singleFile,
        }
      }

      let value = initInputs[item['text-input'].variable]
      if (value && item['text-input'].max_length && value.length > item['text-input'].max_length)
        value = value.slice(0, item['text-input'].max_length)

      return {
        ...item['text-input'],
        default: value || item.default,
        type: 'text-input',
      }
    })
  }, [initInputs, appParams])

  const allInputsHidden = useMemo(() => {
    return inputsForms.length > 0 && inputsForms.every(item => item.hide === true)
  }, [inputsForms])

  useEffect(() => {
    // init inputs from url params
    (async () => {
      const inputs = await getRawInputsFromUrlParams()
      setInitInputs(inputs)
    })()
  }, [])

  useEffect(() => {
    const conversationInputs: Record<string, any> = {}

    inputsForms.forEach((item: any) => {
      conversationInputs[item.variable] = item.default || null
    })
    handleNewConversationInputsChange(conversationInputs)
  }, [handleNewConversationInputsChange, inputsForms])

  const { data: newConversation } = useSWR(newConversationId ? [isInstalledApp, appId, newConversationId] : null, () => generationConversationName(isInstalledApp, appId, newConversationId), { revalidateOnFocus: false })
  const [originConversationList, setOriginConversationList] = useState<ConversationItem[]>([])
  useEffect(() => {
    if (appConversationData?.data && !appConversationDataLoading) {
      console.log('Setting conversation list from server data:', {
        count: appConversationData.data.length,
        conversations: appConversationData.data.map(conv => ({
          id: conv.id,
          name: conv.name,
        })),
      })
      setOriginConversationList(appConversationData?.data)

      // Clean up pinned conversations that no longer exist
      const existingIds = appConversationData.data.map(conv => conv.id)
      cleanupPinnedConversations(existingIds)
    }
  }, [appConversationData, appConversationDataLoading, cleanupPinnedConversations])
  const conversationList = useMemo(() => {
    // Filter out pinned conversations from the regular list
    const unpinnedConversations = originConversationList.filter(conv => !isPinnedConversation(conv.id))
    const data = unpinnedConversations.slice()
    console.log('Regular conversation list (before processing):', originConversationList)
    console.log('Unpinned conversations:', unpinnedConversations)
    console.log('appConversationData:', appConversationData)

    if (showNewConversationItemInList && data[0]?.id !== '') {
      data.unshift({
        id: '',
        name: t('share.chat.newChatDefaultName'),
        inputs: {},
        introduction: '',
      })
    }
    console.log('Final conversation list (after processing):', data)
    return data
  }, [originConversationList, showNewConversationItemInList, t, appConversationData, isPinnedConversation])

  useEffect(() => {
    if (newConversation) {
      setOriginConversationList(produce((draft) => {
        const index = draft.findIndex(item => item.id === newConversation.id)

        if (index > -1)
          draft[index] = newConversation
        else
          draft.unshift(newConversation)
      }))
    }
  }, [newConversation])

  const currentConversationItem = useMemo(() => {
    let conversationItem = conversationList.find(item => item.id === currentConversationId)

    if (!conversationItem && pinnedConversationList.length)
      conversationItem = pinnedConversationList.find(item => item.id === currentConversationId)

    return conversationItem
  }, [conversationList, currentConversationId, pinnedConversationList])

  const currentConversationLatestInputs = useMemo(() => {
    if (!currentConversationId || !appChatListData?.data.length)
      return newConversationInputsRef.current || {}
    return appChatListData.data.slice().pop().inputs || {}
  }, [appChatListData, currentConversationId])
  const [currentConversationInputs, setCurrentConversationInputs] = useState<Record<string, any>>(currentConversationLatestInputs || {})
  useEffect(() => {
    if (currentConversationItem)
      setCurrentConversationInputs(currentConversationLatestInputs || {})
  }, [currentConversationItem, currentConversationLatestInputs])

  const { notify } = useToastContext()
  const checkInputsRequired = useCallback((silent?: boolean) => {
    if (allInputsHidden)
      return true

    let hasEmptyInput = ''
    let fileIsUploading = false
    const requiredVars = inputsForms.filter(({ required }) => required)
    if (requiredVars.length) {
      requiredVars.forEach(({ variable, label, type }) => {
        if (hasEmptyInput)
          return

        if (fileIsUploading)
          return

        if (!newConversationInputsRef.current[variable] && !silent)
          hasEmptyInput = label as string

        if ((type === InputVarType.singleFile || type === InputVarType.multiFiles) && newConversationInputsRef.current[variable] && !silent) {
          const files = newConversationInputsRef.current[variable]
          if (Array.isArray(files))
            fileIsUploading = files.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)
          else
            fileIsUploading = files.transferMethod === TransferMethod.local_file && !files.uploadedId
        }
      })
    }

    if (hasEmptyInput) {
      notify({ type: 'error', message: t('appDebug.errorMessage.valueOfVarRequired', { key: hasEmptyInput }) })
      return false
    }

    if (fileIsUploading) {
      notify({ type: 'info', message: t('appDebug.errorMessage.waitForFileUpload') })
      return
    }

    return true
  }, [inputsForms, notify, t, allInputsHidden])
  const [chatStarted, setChatStarted] = useState(!!currentConversationId)

  const handleStartChat = useCallback((callback: any) => {
    if (checkInputsRequired()) {
      setChatStarted(true)
      setShowNewConversationItemInList(true)
      callback?.()
    }
  }, [setShowNewConversationItemInList, checkInputsRequired])
  const currentChatInstanceRef = useRef<{ handleStop: () => void }>({ handleStop: noop })
  const handleChangeConversation = useCallback((conversationId: string) => {
    if (currentChatInstanceRef && currentChatInstanceRef.current) {
      currentChatInstanceRef.current.handleStop()
    }
    setNewConversationId('')
    handleConversationIdInfoChange(conversationId)
    setChatStarted(!!conversationId)
    if (conversationId)
      setClearChatList(false)
  }, [handleConversationIdInfoChange, setClearChatList])
  const handleNewConversation = useCallback(async () => {
    try {
      // Validate configuration before starting new conversation
      const { validateConfiguration } = await import('@/config')
      const configValidation = validateConfiguration()
      
      if (!configValidation.valid) {
        console.error('Configuration validation failed:', configValidation.errors)
        notify({
          type: 'error',
          message: 'Application configuration error. Please contact support.',
        })
        // Still allow UI reset even if config is invalid
      }
      
      if (currentChatInstanceRef && currentChatInstanceRef.current) {
        currentChatInstanceRef.current.handleStop()
      }
      setShowNewConversationItemInList(true)
      
      // Check if we need to wait for inputs or can start chat immediately
      const hasRequiredInputs = inputsForms.length > 0 && !allInputsHidden
      
      // Set chat started based on whether inputs are required
      setChatStarted(!hasRequiredInputs)
      
      handleChangeConversation('')
      
      // Get raw inputs with error handling
      try {
        const rawInputs = await getRawInputsFromUrlParams()
        handleNewConversationInputsChange(rawInputs)
      } catch (error) {
        console.error('Error getting raw inputs:', error)
        handleNewConversationInputsChange({})
      }
      
      setClearChatList(true)
      
      // Log for debugging
      console.log('New conversation started:', {
        hasRequiredInputs,
        inputsFormsLength: inputsForms.length,
        allInputsHidden,
        chatStarted: !hasRequiredInputs,
      })
    } catch (error) {
      console.error('Error starting new conversation:', error)
      notify({
        type: 'error',
        message: 'Failed to start new conversation. Please try again.',
      })
    }
  }, [handleChangeConversation, setShowNewConversationItemInList, handleNewConversationInputsChange, setClearChatList, notify, inputsForms, allInputsHidden])
  const handleUpdateConversationList = useCallback(() => {
    console.log('🔄 Force updating conversation lists from server...')
    // Force revalidation without cache - completely clear cache and refetch
    mutateAppConversationData(undefined, { revalidate: true })

    // Also manually clear the SWR cache for these keys
    if (typeof window !== 'undefined') {
      const swrCache = window.__SWR_CACHE__ || new Map()
      const keysToDelete = []
      for (const key of swrCache.keys()) {
        if (typeof key === 'string' && key.includes('appConversationData'))
          keysToDelete.push(key)
      }
      keysToDelete.forEach((key) => {
        console.log('🧹 Clearing SWR cache key:', key)
        swrCache.delete(key)
      })
    }
  }, [mutateAppConversationData])

  // Debug utility function
  const clearDeletedConversationsDebugData = useCallback(() => {
    localStorage.removeItem('deletedConversations')
    localStorage.removeItem('persistentDeletedConversations')
    console.log('🧹 Cleared all deleted conversations debug data')
  }, [])

  const handlePinConversation = useCallback(async (conversationId: string) => {
    try {
      // Update local state first for immediate UI feedback
      addToPinnedList(conversationId)

      // Then call the API (which now just acknowledges the request)
      await pinConversation(isInstalledApp, appId, conversationId)
      notify({ type: 'success', message: t('common.api.success') })
    }
    catch (error) {
      // Revert local state if API call fails
      removeFromPinnedList(conversationId)
      console.error('Error pinning conversation:', error)
      notify({ type: 'error', message: 'Failed to pin conversation' })
    }
  }, [isInstalledApp, appId, notify, t, addToPinnedList, removeFromPinnedList])

  const handleUnpinConversation = useCallback(async (conversationId: string) => {
    try {
      // Update local state first for immediate UI feedback
      removeFromPinnedList(conversationId)

      // Then call the API (which now just acknowledges the request)
      await unpinConversation(isInstalledApp, appId, conversationId)
      notify({ type: 'success', message: t('common.api.success') })
    }
    catch (error) {
      // Revert local state if API call fails
      addToPinnedList(conversationId)
      console.error('Error unpinning conversation:', error)
      notify({ type: 'error', message: 'Failed to unpin conversation' })
    }
  }, [isInstalledApp, appId, notify, t, addToPinnedList, removeFromPinnedList])

  const [conversationDeleting, setConversationDeleting] = useState(false)
  const handleDeleteConversation = useCallback(async (
    conversationId: string,
    {
      onSuccess,
    }: Callback,
  ) => {
    if (conversationDeleting)
      return

    try {
      setConversationDeleting(true)

      // First, delete from server
      const result = await delConversation(isInstalledApp, appId, conversationId, userId)
      console.log('🗑️ Delete conversation result:', result)

      // Wait a brief moment for server processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Then update local state and UI
      console.log('🗑️ Removing conversation from local state:', conversationId)
      setOriginConversationList(produce((draft) => {
        const index = draft.findIndex(item => item.id === conversationId)
        if (index > -1)
          draft.splice(index, 1)
      }))

      notify({ type: 'success', message: t('common.api.success') })
      onSuccess()

      if (conversationId === currentConversationId)
        handleNewConversation()

      // Force refresh conversation list from server with staggered timing
      console.log('🔄 Immediate refresh after deletion')
      handleUpdateConversationList()

      // Additional delayed refreshes to ensure server synchronization
      setTimeout(() => {
        console.log('🔄 First delayed refresh (500ms) after deletion')
        handleUpdateConversationList()
      }, 500)

      setTimeout(() => {
        console.log('🔄 Second delayed refresh (2000ms) after deletion')
        handleUpdateConversationList()
      }, 2000)
    }
    catch (error) {
      console.error('Delete conversation failed in hook:', error)
      notify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete conversation',
      })
    }
    finally {
      setConversationDeleting(false)
    }
  }, [isInstalledApp, appId, notify, t, handleUpdateConversationList, handleNewConversation, currentConversationId, conversationDeleting])

  const [conversationRenaming, setConversationRenaming] = useState(false)
  const handleRenameConversation = useCallback(async (
    conversationId: string,
    newName: string,
    {
      onSuccess,
    }: Callback,
  ) => {
    if (conversationRenaming)
      return

    if (!newName.trim()) {
      notify({
        type: 'error',
        message: t('common.chat.conversationNameCanNotEmpty'),
      })
      return
    }

    setConversationRenaming(true)
    try {
      await renameConversation(isInstalledApp, appId, conversationId, newName)

      notify({
        type: 'success',
        message: t('common.actionMsg.modifiedSuccessfully'),
      })
      setOriginConversationList(produce((draft) => {
        const index = originConversationList.findIndex(item => item.id === conversationId)
        const item = draft[index]

        draft[index] = {
          ...item,
          name: newName,
        }
      }))
      onSuccess()
    }
    finally {
      setConversationRenaming(false)
    }
  }, [isInstalledApp, appId, notify, t, conversationRenaming, originConversationList])

  const handleNewConversationCompleted = useCallback((newConversationId: string) => {
    setNewConversationId(newConversationId)
    handleConversationIdInfoChange(newConversationId)
    setShowNewConversationItemInList(false)
    mutateAppConversationData()
  }, [mutateAppConversationData, handleConversationIdInfoChange])

  const handleFeedback = useCallback(async (messageId: string, feedback: Feedback) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating } }, isInstalledApp, appId)
    notify({ type: 'success', message: t('common.api.success') })
  }, [isInstalledApp, appId, t, notify])

  return {
    appInfoError,
    appInfoLoading: appInfoLoading || (systemFeatures.webapp_auth.enabled && isCheckingPermission),
    userCanAccess: systemFeatures.webapp_auth.enabled ? userCanAccessResult?.result : true,
    isInstalledApp,
    appId,
    currentConversationId,
    currentConversationItem,
    handleConversationIdInfoChange,
    appData,
    appParams: appParams || {} as ChatConfig,
    appMeta,
    appConversationData,
    appConversationDataLoading,
    appChatListData,
    appChatListDataLoading,
    appPrevChatTree,
    pinnedConversationList,
    conversationList,
    setShowNewConversationItemInList,
    newConversationInputs,
    newConversationInputsRef,
    handleNewConversationInputsChange,
    inputsForms,
    handleNewConversation,
    handleStartChat,
    handleChangeConversation,
    handlePinConversation,
    handleUnpinConversation,
    conversationDeleting,
    handleDeleteConversation,
    conversationRenaming,
    handleRenameConversation,
    handleNewConversationCompleted,
    newConversationId,
    chatShouldReloadKey,
    handleFeedback,
    currentChatInstanceRef,
    sidebarCollapseState,
    handleSidebarCollapse,
    clearChatList,
    setClearChatList,
    isResponding,
    setIsResponding,
    currentConversationInputs,
    setCurrentConversationInputs,
    allInputsHidden,
    clearDeletedConversationsDebugData,
    chatStarted,
    setChatStarted,
  }
}
