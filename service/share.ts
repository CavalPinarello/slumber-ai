import type {
  IOnCompleted,
  IOnData,
  IOnError,
  IOnFile,
  IOnIterationFinished,
  IOnIterationNext,
  IOnIterationStarted,
  IOnLoopFinished,
  IOnLoopNext,
  IOnLoopStarted,
  IOnMessageEnd,
  IOnMessageReplace,
  IOnNodeFinished,
  IOnNodeStarted,
  IOnTTSChunk,
  IOnTTSEnd,
  IOnTextChunk,
  IOnTextReplace,
  IOnThought,
  IOnWorkflowFinished,
  IOnWorkflowStarted,
} from './base'
import {
  del as consoleDel, get as consoleGet, patch as consolePatch, post as consolePost, delPublic as del,
  getPublic as get, patchPublic as patch, postPublic as post, request, ssePost,
} from './base'
import type { FeedbackType } from '@/app/components/base/chat/chat/type'
import type {
  AppConversationData,
  AppData,
  AppMeta,
  ConversationItem,
} from '@/models/share'
import type { ChatConfig } from '@/app/components/base/chat/types'
import type { AccessMode } from '@/models/access-control'

function getAction(action: 'get' | 'post' | 'del' | 'patch', isInstalledApp: boolean) {
  switch (action) {
    case 'get':
      return isInstalledApp ? consoleGet : get
    case 'post':
      return isInstalledApp ? consolePost : post
    case 'patch':
      return isInstalledApp ? consolePatch : patch
    case 'del':
      return isInstalledApp ? consoleDel : del
  }
}

export function getUrl(url: string, isInstalledApp: boolean, installedAppId: string) {
  return isInstalledApp ? `installed-apps/${installedAppId}/${url.startsWith('/') ? url.slice(1) : url}` : url
}

export const sendChatMessage = async (body: Record<string, any>, { onData, onCompleted, onThought, onFile, onError, getAbortController, onMessageEnd, onMessageReplace, onTTSChunk, onTTSEnd }: {
  onData: IOnData
  onCompleted: IOnCompleted
  onFile: IOnFile
  onThought: IOnThought
  onError: IOnError
  onMessageEnd?: IOnMessageEnd
  onMessageReplace?: IOnMessageReplace
  getAbortController?: (abortController: AbortController) => void
  onTTSChunk?: IOnTTSChunk
  onTTSEnd?: IOnTTSEnd
}, isInstalledApp: boolean, installedAppId = '') => {
  return ssePost(getUrl('chat-messages', isInstalledApp, installedAppId), {
    body: {
      ...body,
      response_mode: 'streaming',
      user: body.user || 'webapp-user', // Ensure user parameter is included
    },
  }, { onData, onCompleted, onThought, onFile, isPublicAPI: !isInstalledApp, onError, getAbortController, onMessageEnd, onMessageReplace, onTTSChunk, onTTSEnd })
}

export const stopChatMessageResponding = async (appId: string, taskId: string, isInstalledApp: boolean, installedAppId = '') => {
  return getAction('post', isInstalledApp)(getUrl(`chat-messages/${taskId}/stop`, isInstalledApp, installedAppId))
}

export const sendCompletionMessage = async (body: Record<string, any>, { onData, onCompleted, onError, onMessageReplace }: {
  onData: IOnData
  onCompleted: IOnCompleted
  onError: IOnError
  onMessageReplace: IOnMessageReplace
}, isInstalledApp: boolean, installedAppId = '') => {
  return ssePost(getUrl('completion-messages', isInstalledApp, installedAppId), {
    body: {
      ...body,
      response_mode: 'streaming',
      user: body.user || 'webapp-user', // Ensure user parameter is included
    },
  }, { onData, onCompleted, isPublicAPI: !isInstalledApp, onError, onMessageReplace })
}

export const sendWorkflowMessage = async (
  body: Record<string, any>,
  {
    onWorkflowStarted,
    onNodeStarted,
    onNodeFinished,
    onWorkflowFinished,
    onIterationStart,
    onIterationNext,
    onIterationFinish,
    onLoopStart,
    onLoopNext,
    onLoopFinish,
    onTextChunk,
    onTextReplace,
  }: {
    onWorkflowStarted: IOnWorkflowStarted
    onNodeStarted: IOnNodeStarted
    onNodeFinished: IOnNodeFinished
    onWorkflowFinished: IOnWorkflowFinished
    onIterationStart: IOnIterationStarted
    onIterationNext: IOnIterationNext
    onIterationFinish: IOnIterationFinished
    onLoopStart: IOnLoopStarted
    onLoopNext: IOnLoopNext
    onLoopFinish: IOnLoopFinished
    onTextChunk: IOnTextChunk
    onTextReplace: IOnTextReplace
  },
  isInstalledApp: boolean,
  installedAppId = '',
) => {
  return ssePost(getUrl('workflows/run', isInstalledApp, installedAppId), {
    body: {
      ...body,
      response_mode: 'streaming',
      user: body.user || 'webapp-user', // Ensure user parameter is included
    },
  }, {
    onNodeStarted,
    onWorkflowStarted,
    onWorkflowFinished,
    isPublicAPI: !isInstalledApp,
    onNodeFinished,
    onIterationStart,
    onIterationNext,
    onIterationFinish,
    onLoopStart,
    onLoopNext,
    onLoopFinish,
    onTextChunk,
    onTextReplace,
  })
}

export const fetchAppInfo = async () => {
  try {
    const siteInfo = await request('site', { method: 'GET' }, { isPublicAPI: false }) as any
    return {
      app_id: process.env.NEXT_PUBLIC_APP_ID || '',
      site: siteInfo,
    } as AppData
  }
  catch (error) {
    console.warn('Failed to fetch app info, using fallback:', error)
    // Return fallback data if API fails
    return {
      app_id: process.env.NEXT_PUBLIC_APP_ID || '',
      site: {
        title: 'Chat App',
        icon: '🤖',
        icon_type: 'emoji',
        icon_url: null,
        icon_background: '#D5F5F6',
        privacy_policy: process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL || '',
      },
    } as AppData
  }
}

export const fetchConversations = async (isInstalledApp: boolean, installedAppId = '', last_id?: string, pinned?: boolean, limit?: number) => {
  const url = getUrl('conversations', isInstalledApp, installedAppId)
  const params = { ...{ limit: limit || 20 }, ...(last_id ? { last_id } : {}), ...(pinned !== undefined ? { pinned } : {}) }
  console.log('🔍 fetchConversations called with:', { isInstalledApp, installedAppId, last_id, pinned, limit, timestamp: new Date().toISOString() })
  console.log('🔍 fetchConversations URL:', url, 'params:', params)

  let result: AppConversationData;
  
  try {
    result = await getAction('get', isInstalledApp)(url, { params }) as Promise<AppConversationData>
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return { data: [], has_more: false, limit: limit || 20 } as AppConversationData;
  }
  console.log('🔍 fetchConversations result for pinned =', pinned, ':', result)

  // Enhanced logging for debugging deletion persistence
  if (result?.data) {
    const conversationIds = result.data.map(conv => conv.id)
    console.log(`🔍 Fetched ${result.data.length} conversations (pinned=${pinned}):`, conversationIds)

    // Log full conversation details for debugging
    const conversationDetails = result.data.map(conv => ({
      id: conv.id,
      name: conv.name,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
    }))
    console.log('🔍 Full conversation details:', conversationDetails)

    // Check if we have any deleted conversations appearing
    const deletedConversations = JSON.parse(localStorage.getItem('deletedConversations') || '[]')
    const persistentDeletedConversations = JSON.parse(localStorage.getItem('persistentDeletedConversations') || '[]')
    const reappearingConversations = conversationIds.filter(id => deletedConversations.includes(id))

    if (reappearingConversations.length > 0)
      console.warn('⚠️ PERSISTENCE ISSUE: These deleted conversations are reappearing:', reappearingConversations)

    // Filter out persistently deleted conversations from server response
    if (persistentDeletedConversations.length > 0) {
      const filteredData = result.data.filter(conv => !persistentDeletedConversations.includes(conv.id))
      const filteredCount = result.data.length - filteredData.length

      if (filteredCount > 0) {
        console.log('🗑️ Filtered out', filteredCount, 'persistently deleted conversations:',
          result.data.filter(conv => persistentDeletedConversations.includes(conv.id)).map(c => c.id))
        result.data = filteredData
      }
    }
  }

  return result
}

export const pinConversation = async (isInstalledApp: boolean, installedAppId = '', id: string) => {
  // Check if ID is valid
  if (!id || typeof id !== 'string' || id.trim() === '') {
    console.error('Conversation ID is invalid:', id, 'Type:', typeof id)
    throw new Error('Conversation ID must be a non-empty string')
  }

  const encodedId = encodeURIComponent(id)
  return getAction('patch', isInstalledApp)(getUrl(`conversations/${encodedId}/pin`, isInstalledApp, installedAppId))
}

export const unpinConversation = async (isInstalledApp: boolean, installedAppId = '', id: string) => {
  // Check if ID is valid
  if (!id || typeof id !== 'string' || id.trim() === '') {
    console.error('Conversation ID is invalid:', id, 'Type:', typeof id)
    throw new Error('Conversation ID must be a non-empty string')
  }

  const encodedId = encodeURIComponent(id)
  return getAction('patch', isInstalledApp)(getUrl(`conversations/${encodedId}/unpin`, isInstalledApp, installedAppId))
}

export const delConversation = async (isInstalledApp: boolean, installedAppId = '', id: string, userId = 'webapp-user') => {
  console.log('🗑️ delConversation called with:', { isInstalledApp, installedAppId, id, timestamp: new Date().toISOString() })

  // Track deleted conversations in localStorage for debugging
  const deletedConversations = JSON.parse(localStorage.getItem('deletedConversations') || '[]')
  if (!deletedConversations.includes(id)) {
    deletedConversations.push(id)
    localStorage.setItem('deletedConversations', JSON.stringify(deletedConversations))
    console.log('🗑️ Added to deleted list:', id, 'Total deleted:', deletedConversations.length)
  }

  // Use local API endpoint for conversation deletion
  const apiUrl = `/api/conversations/${id}`
  console.log('🗑️ Calling local API:', apiUrl)

  const response = await fetch(apiUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
    }),
  })

  console.log('🗑️ Local API response status:', response.status)

  if (!response.ok) {
    let errorData = {}
    try {
      errorData = await response.json()
    }
    catch (parseError) {
      console.error('🗑️ Failed to parse error response:', parseError)
    }

    console.error('🗑️ Delete conversation error:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
    })

    // If it's a 404, treat as successful (conversation already deleted)
    if (response.status === 404) {
      console.log('🗑️ 404 - Conversation already deleted:', id)

      // Store in persistent deleted list for client-side filtering
      const persistentDeletedConversations = JSON.parse(localStorage.getItem('persistentDeletedConversations') || '[]')
      if (!persistentDeletedConversations.includes(id)) {
        persistentDeletedConversations.push(id)
        localStorage.setItem('persistentDeletedConversations', JSON.stringify(persistentDeletedConversations))
        console.log('🗑️ Added to persistent deleted list (404 case):', id)
      }

      // Check if our API returned success response for 404
      if (errorData.success)
        return errorData

      // Even if raw 404, treat as success for UI purposes
      return {
        success: true,
        message: 'Conversation already deleted',
        conversationId: id,
      }
    }

    const errorMessage = errorData.error || `Failed to delete conversation: ${response.status}`
    throw new Error(errorMessage)
  }

  const result = await response.json()
  console.log('🗑️ Delete conversation success:', result)

  // Store successfully deleted conversation ID for client-side filtering
  const persistentDeletedConversations = JSON.parse(localStorage.getItem('persistentDeletedConversations') || '[]')
  if (!persistentDeletedConversations.includes(id)) {
    persistentDeletedConversations.push(id)
    localStorage.setItem('persistentDeletedConversations', JSON.stringify(persistentDeletedConversations))
    console.log('🗑️ Added to persistent deleted list:', id)
  }

  return result
}

export const renameConversation = async (isInstalledApp: boolean, installedAppId = '', id: string, name: string) => {
  return getAction('post', isInstalledApp)(getUrl(`conversations/${id}/name`, isInstalledApp, installedAppId), { body: { name } })
}

export const generationConversationName = async (isInstalledApp: boolean, installedAppId = '', id: string) => {
  // Auto-generate name endpoint only exists for installed apps
  if (!isInstalledApp) {
    console.log('📝 Auto-generate conversation name not available for public API')
    // Return a default conversation with the given ID
    return {
      id,
      name: 'New Conversation',
      inputs: {},
      introduction: '',
    } as ConversationItem
  }
  
  try {
    const result = await getAction('post', isInstalledApp)(getUrl(`conversations/${id}/name`, isInstalledApp, installedAppId), { body: { auto_generate: true } }) as Promise<ConversationItem>

    // Remove emojis from the generated conversation name if configured to do so
    if (result && result.name) {
      const { REMOVE_EMOJIS_FROM_TITLES } = await import('@/config')
      if (REMOVE_EMOJIS_FROM_TITLES) {
        const { removeEmojis } = await import('@/utils')
        result.name = removeEmojis(result.name)
      }
    }

    return result
  } catch (error: any) {
    console.log('Failed to generate conversation name:', error)
    // Return a default conversation with the given ID
    return {
      id,
      name: 'New Conversation',
      inputs: {},
      introduction: '',
    } as ConversationItem
  }
}

export const fetchChatList = async (conversationId: string, isInstalledApp: boolean, installedAppId = '') => {
  if (!conversationId || conversationId.trim() === '') {
    console.warn('fetchChatList called with empty conversationId:', conversationId)
    return { data: [] }
  }

  console.log('🔍 fetchChatList called with valid conversationId:', conversationId)
  
  try {
    const result = await getAction('get', isInstalledApp)(getUrl('messages', isInstalledApp, installedAppId), { params: { conversation_id: conversationId, limit: 20, last_id: '' } }) as any
    return result
  } catch (error: any) {
    // Handle 404 errors gracefully - conversation doesn't exist yet
    if (error?.status === 404 || error?.response?.status === 404) {
      console.log('📝 Conversation not found (404), returning empty message list')
      return { data: [] }
    }
    // Re-throw other errors
    console.error('Error fetching chat list:', error)
    throw error
  }
}

// Abandoned API interface
// export const fetchAppVariables = async () => {
//   return get(`variables`)
// }

// init value. wait for server update
export const fetchAppParams = async (isInstalledApp: boolean, installedAppId = '') => {
  try {
    // Fetch with silent error handling to prevent "Server Error" toasts on initial load
    const result = await (getAction('get', isInstalledApp))(getUrl('parameters', isInstalledApp, installedAppId), {}, { silent: true }) as Promise<ChatConfig>;
    return result;
  } catch (error) {
    console.log('App params fetch failed, using defaults (non-critical):', error);
    // Return default configuration on error
    return {
      opening_statement: '',
      suggested_questions: [],
      features: {
        text_to_speech: { enabled: false },
        speech_to_text: { enabled: false },
        file_upload: {
          enabled: false,
          allowed_file_types: [],
          allowed_file_extensions: [],
          allowed_file_upload_methods: [],
          number_limits: 0,
          fileUploadConfig: {},
        },
        citation: { enabled: false },
        moderation: { enabled: false },
        annotation_reply: { enabled: false },
      },
      user_input_form: [],
      workflow: null,
    } as ChatConfig;
  }
}

export const fetchWebSAMLSSOUrl = async (appCode: string, redirectUrl: string) => {
  return (getAction('get', false))(getUrl('/enterprise/sso/saml/login', false, ''), {
    params: {
      app_code: appCode,
      redirect_url: redirectUrl,
    },
  }) as Promise<{ url: string }>
}

export const fetchWebOIDCSSOUrl = async (appCode: string, redirectUrl: string) => {
  return (getAction('get', false))(getUrl('/enterprise/sso/oidc/login', false, ''), {
    params: {
      app_code: appCode,
      redirect_url: redirectUrl,
    },

  }) as Promise<{ url: string }>
}

export const fetchWebOAuth2SSOUrl = async (appCode: string, redirectUrl: string) => {
  return (getAction('get', false))(getUrl('/enterprise/sso/oauth2/login', false, ''), {
    params: {
      app_code: appCode,
      redirect_url: redirectUrl,
    },
  }) as Promise<{ url: string }>
}

export const fetchMembersSAMLSSOUrl = async (appCode: string, redirectUrl: string) => {
  return (getAction('get', false))(getUrl('/enterprise/sso/members/saml/login', false, ''), {
    params: {
      app_code: appCode,
      redirect_url: redirectUrl,
    },
  }) as Promise<{ url: string }>
}

export const fetchMembersOIDCSSOUrl = async (appCode: string, redirectUrl: string) => {
  return (getAction('get', false))(getUrl('/enterprise/sso/members/oidc/login', false, ''), {
    params: {
      app_code: appCode,
      redirect_url: redirectUrl,
    },

  }) as Promise<{ url: string }>
}

export const fetchMembersOAuth2SSOUrl = async (appCode: string, redirectUrl: string) => {
  return (getAction('get', false))(getUrl('/enterprise/sso/members/oauth2/login', false, ''), {
    params: {
      app_code: appCode,
      redirect_url: redirectUrl,
    },
  }) as Promise<{ url: string }>
}

export const fetchAppMeta = async (isInstalledApp: boolean, installedAppId = '') => {
  try {
    // Fetch with silent error handling to prevent "Server Error" toasts on initial load
    const result = await (getAction('get', isInstalledApp))(getUrl('meta', isInstalledApp, installedAppId), {}, { silent: true }) as Promise<AppMeta>;
    return result;
  } catch (error) {
    console.log('App meta fetch failed, using defaults (non-critical):', error);
    // Return default metadata on error
    return {
      tool_icons: {},
    } as AppMeta;
  }
}

export const updateFeedback = async ({ url, body }: { url: string; body: FeedbackType }, isInstalledApp: boolean, installedAppId = '') => {
  return (getAction('post', isInstalledApp))(getUrl(url, isInstalledApp, installedAppId), { body })
}

export const fetchMoreLikeThis = async (messageId: string, isInstalledApp: boolean, installedAppId = '') => {
  return (getAction('get', isInstalledApp))(getUrl(`/messages/${messageId}/more-like-this`, isInstalledApp, installedAppId), {
    params: {
      response_mode: 'blocking',
    },
  })
}

export const saveMessage = (messageId: string, isInstalledApp: boolean, installedAppId = '') => {
  return (getAction('post', isInstalledApp))(getUrl('/saved-messages', isInstalledApp, installedAppId), { body: { message_id: messageId } })
}

export const fetchSavedMessage = async (isInstalledApp: boolean, installedAppId = '') => {
  return (getAction('get', isInstalledApp))(getUrl('/saved-messages', isInstalledApp, installedAppId))
}

export const removeMessage = (messageId: string, isInstalledApp: boolean, installedAppId = '') => {
  return (getAction('del', isInstalledApp))(getUrl(`/saved-messages/${messageId}`, isInstalledApp, installedAppId))
}

export const fetchSuggestedQuestions = async (messageId: string, isInstalledApp: boolean, installedAppId = '') => {
  // Suggested questions endpoint only exists for installed apps
  if (!isInstalledApp) {
    console.log('📝 Suggested questions not available for public API')
    return { data: [] }
  }
  
  try {
    return await (getAction('get', isInstalledApp))(getUrl(`/messages/${messageId}/suggested-questions`, isInstalledApp, installedAppId))
  } catch (error: any) {
    console.log('Failed to fetch suggested questions:', error)
    return { data: [] }
  }
}

export const audioToText = (url: string, isPublicAPI: boolean, body: FormData) => {
  return (getAction('post', !isPublicAPI))(url, { body }, { bodyStringify: false, deleteContentType: true }) as Promise<{ text: string }>
}

export const textToAudio = (url: string, isPublicAPI: boolean, body: FormData) => {
  return (getAction('post', !isPublicAPI))(url, { body }, { bodyStringify: false, deleteContentType: true }) as Promise<{ data: string }>
}

export const textToAudioStream = (url: string, isPublicAPI: boolean, header: { content_type: string }, body: { streaming: boolean; voice?: string; message_id?: string; text?: string | null | undefined }) => {
  return (getAction('post', !isPublicAPI))(url, { body, header }, { needAllResponseContent: true })
}

export const getAppAccessMode = (appId: string, isInstalledApp: boolean) => {
  if (isInstalledApp)
    return consoleGet<{ accessMode: AccessMode }>(`/enterprise/webapp/app/access-mode?appId=${appId}`)

  return get<{ accessMode: AccessMode }>(`/webapp/access-mode?appId=${appId}`)
}

export const getUserCanAccess = (appId: string, isInstalledApp: boolean) => {
  if (isInstalledApp)
    return consoleGet<{ result: boolean }>(`/enterprise/webapp/permission?appId=${appId}`)

  return get<{ result: boolean }>(`/webapp/permission?appId=${appId}`)
}

export const getAppAccessModeByAppCode = (appCode: string) => {
  return get<{ accessMode: AccessMode }>(`/webapp/access-mode?appCode=${appCode}`)
}
