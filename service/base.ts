import { refreshAccessTokenOrRelogin } from './refresh-token'
import type { FetchOptionType, ResponseError } from './fetch'
import { ContentType, base, baseOptions, getAccessToken } from './fetch'
import { handleFetchError, handleSSEError } from './error-handler'
import { API_PREFIX, API_URL, IS_CE_EDITION, PUBLIC_API_PREFIX } from '@/config'
import Toast from '@/app/components/base/toast'
import { basePath } from '@/utils/var'
import type { AnnotationReply, MessageEnd, MessageReplace, ThoughtItem } from '@/app/components/base/chat/chat/type'
import type { VisionFile } from '@/types/app'
import type {
  AgentLogResponse,
  IterationFinishedResponse,
  IterationNextResponse,
  IterationStartedResponse,
  LoopFinishedResponse,
  LoopNextResponse,
  LoopStartedResponse,
  NodeFinishedResponse,
  NodeStartedResponse,
  ParallelBranchFinishedResponse,
  ParallelBranchStartedResponse,
  TextChunkResponse,
  TextReplaceResponse,
  WorkflowFinishedResponse,
  WorkflowStartedResponse,
} from '@/types/workflow'
import { removeAccessToken } from '@/app/components/share/utils'
import { asyncRunSafe } from '@/utils'
const TIME_OUT = 100000

export type IOnDataMoreInfo = {
  conversationId?: string
  taskId?: string
  messageId: string
  errorMessage?: string
  errorCode?: string
}

export type IOnData = (message: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => void
export type IOnThought = (though: ThoughtItem) => void
export type IOnFile = (file: VisionFile) => void
export type IOnMessageEnd = (messageEnd: MessageEnd) => void
export type IOnMessageReplace = (messageReplace: MessageReplace) => void
export type IOnAnnotationReply = (messageReplace: AnnotationReply) => void
export type IOnCompleted = (hasError?: boolean, errorMessage?: string) => void
export type IOnError = (msg: string, code?: string) => void

export type IOnWorkflowStarted = (workflowStarted: WorkflowStartedResponse) => void
export type IOnWorkflowFinished = (workflowFinished: WorkflowFinishedResponse) => void
export type IOnNodeStarted = (nodeStarted: NodeStartedResponse) => void
export type IOnNodeFinished = (nodeFinished: NodeFinishedResponse) => void
export type IOnIterationStarted = (workflowStarted: IterationStartedResponse) => void
export type IOnIterationNext = (workflowStarted: IterationNextResponse) => void
export type IOnNodeRetry = (nodeFinished: NodeFinishedResponse) => void
export type IOnIterationFinished = (workflowFinished: IterationFinishedResponse) => void
export type IOnParallelBranchStarted = (parallelBranchStarted: ParallelBranchStartedResponse) => void
export type IOnParallelBranchFinished = (parallelBranchFinished: ParallelBranchFinishedResponse) => void
export type IOnTextChunk = (textChunk: TextChunkResponse) => void
export type IOnTTSChunk = (messageId: string, audioStr: string, audioType?: string) => void
export type IOnTTSEnd = (messageId: string, audioStr: string, audioType?: string) => void
export type IOnTextReplace = (textReplace: TextReplaceResponse) => void
export type IOnLoopStarted = (workflowStarted: LoopStartedResponse) => void
export type IOnLoopNext = (workflowStarted: LoopNextResponse) => void
export type IOnLoopFinished = (workflowFinished: LoopFinishedResponse) => void
export type IOnAgentLog = (agentLog: AgentLogResponse) => void

export type IOtherOptions = {
  isPublicAPI?: boolean
  isMarketplaceAPI?: boolean
  bodyStringify?: boolean
  needAllResponseContent?: boolean
  deleteContentType?: boolean
  silent?: boolean
  onData?: IOnData // for stream
  onThought?: IOnThought
  onFile?: IOnFile
  onMessageEnd?: IOnMessageEnd
  onMessageReplace?: IOnMessageReplace
  onError?: IOnError
  onCompleted?: IOnCompleted // for stream
  getAbortController?: (abortController: AbortController) => void

  onWorkflowStarted?: IOnWorkflowStarted
  onWorkflowFinished?: IOnWorkflowFinished
  onNodeStarted?: IOnNodeStarted
  onNodeFinished?: IOnNodeFinished
  onIterationStart?: IOnIterationStarted
  onIterationNext?: IOnIterationNext
  onIterationFinish?: IOnIterationFinished
  onNodeRetry?: IOnNodeRetry
  onParallelBranchStarted?: IOnParallelBranchStarted
  onParallelBranchFinished?: IOnParallelBranchFinished
  onTextChunk?: IOnTextChunk
  onTTSChunk?: IOnTTSChunk
  onTTSEnd?: IOnTTSEnd
  onTextReplace?: IOnTextReplace
  onLoopStart?: IOnLoopStarted
  onLoopNext?: IOnLoopNext
  onLoopFinish?: IOnLoopFinished
  onAgentLog?: IOnAgentLog
}

function unicodeToChar(text: string) {
  if (!text)
    return ''

  return text.replace(/\\u([0-9a-f]{4})/g, (_match, p1) => {
    return String.fromCharCode(Number.parseInt(p1, 16))
  })
}

function requiredWebSSOLogin(message?: string, code?: number) {
  const params = new URLSearchParams()
  params.append('redirect_url', globalThis.location.pathname)
  if (message)
    params.append('message', message)
  if (code)
    params.append('code', String(code))
  globalThis.location.href = `/webapp-signin?${params.toString()}`
}

export function format(text: string) {
  let res = text.trim()
  if (res.startsWith('\n'))
    res = res.replace('\n', '')

  return res.replaceAll('\n', '<br/>').replaceAll('```', '')
}

const handleStream = (
  response: Response,
  onData: IOnData,
  onCompleted?: IOnCompleted,
  onThought?: IOnThought,
  onMessageEnd?: IOnMessageEnd,
  onMessageReplace?: IOnMessageReplace,
  onFile?: IOnFile,
  onWorkflowStarted?: IOnWorkflowStarted,
  onWorkflowFinished?: IOnWorkflowFinished,
  onNodeStarted?: IOnNodeStarted,
  onNodeFinished?: IOnNodeFinished,
  onIterationStart?: IOnIterationStarted,
  onIterationNext?: IOnIterationNext,
  onIterationFinish?: IOnIterationFinished,
  onLoopStart?: IOnLoopStarted,
  onLoopNext?: IOnLoopNext,
  onLoopFinish?: IOnLoopFinished,
  onNodeRetry?: IOnNodeRetry,
  onParallelBranchStarted?: IOnParallelBranchStarted,
  onParallelBranchFinished?: IOnParallelBranchFinished,
  onTextChunk?: IOnTextChunk,
  onTTSChunk?: IOnTTSChunk,
  onTTSEnd?: IOnTTSEnd,
  onTextReplace?: IOnTextReplace,
  onAgentLog?: IOnAgentLog,
) => {
  if (!response.ok)
    throw new Error('Network response was not ok')

  const reader = response.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let bufferObj: Record<string, any>
  let isFirstMessage = true
  function read() {
    let hasError = false
    reader?.read().then((result: any) => {
      if (result.done) {
        onCompleted && onCompleted()
        return
      }
      const chunk = decoder.decode(result.value, { stream: true })
      buffer += chunk

      const lines = buffer.split('\n')

      // Keep the last line in buffer if it doesn't end with newline
      buffer = lines.pop() || ''

      try {
        lines.forEach((message) => {
          if (message.startsWith('data: ')) { // check if it starts with data:
            try {
              let jsonStr = message.substring(6).trim()
              if (!jsonStr || jsonStr === '[DONE]')
                return

              // Decode URL-encoded characters that might be in the JSON string
              const originalJsonStr = jsonStr
              try {
                // Only decode if it contains URL-encoded characters
                if (jsonStr.includes('%')) {
                  jsonStr = decodeURIComponent(jsonStr)
                  console.log('🔧 Decoded JSON string:', { original: originalJsonStr, decoded: jsonStr })
                }
              }
              catch (decodeError) {
                // If decoding fails, use original string
                console.warn('Failed to decode URL-encoded JSON string, using original:', decodeError)
                jsonStr = originalJsonStr
              }

              // Validate JSON string format before parsing
              if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
                console.warn('Invalid JSON format in SSE:', {
                  message,
                  jsonStr,
                  firstChar: jsonStr.charAt(0),
                  length: jsonStr.length,
                })
                return
              }

              try {
                bufferObj = JSON.parse(jsonStr) as Record<string, any>// remove data: and parse as json
              }
              catch (parseError) {
                console.error('JSON parse error in SSE:', {
                  error: parseError,
                  originalMessage: message,
                  jsonStr,
                  length: jsonStr.length,
                  sample: jsonStr.substring(0, 100),
                })
                return // Skip this message and continue processing
              }

              // Validate parsed object structure
              if (!bufferObj || typeof bufferObj !== 'object') {
                console.warn('Invalid parsed object structure:', bufferObj)
                return
              }
            }
            catch (error) {
              // Enhanced error handling for JSON parsing
              console.error('SSE message processing error:', {
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                originalMessage: message,
                jsonExtract: message.substring(6, 106), // First 100 chars after 'data: '
                messageLength: message.length,
                stack: error instanceof Error ? error.stack : undefined,
              })

              // Skip this message and continue processing
              return
            }
            if (bufferObj.status === 400 || !bufferObj.event) {
              // Safely handle error messages
              const errorMessage = typeof bufferObj?.message === 'string'
                ? bufferObj.message.slice(0, 1000) // Limit length
                : 'Unknown error occurred'

              onData('', false, {
                conversationId: undefined,
                messageId: '',
                errorMessage,
                errorCode: bufferObj?.code,
              })
              hasError = true
              onCompleted?.(true, errorMessage)
              return
            }
            if (bufferObj.event === 'message' || bufferObj.event === 'agent_message') {
              // can not use format here. Because message is splitted.
              onData(unicodeToChar(bufferObj.answer), isFirstMessage, {
                conversationId: bufferObj.conversation_id,
                taskId: bufferObj.task_id,
                messageId: bufferObj.id,
              })
              isFirstMessage = false
            }
            else if (bufferObj.event === 'agent_thought') {
              onThought?.(bufferObj as ThoughtItem)
            }
            else if (bufferObj.event === 'message_file') {
              onFile?.(bufferObj as VisionFile)
            }
            else if (bufferObj.event === 'message_end') {
              onMessageEnd?.(bufferObj as MessageEnd)
            }
            else if (bufferObj.event === 'message_replace') {
              onMessageReplace?.(bufferObj as MessageReplace)
            }
            else if (bufferObj.event === 'workflow_started') {
              onWorkflowStarted?.(bufferObj as WorkflowStartedResponse)
            }
            else if (bufferObj.event === 'workflow_finished') {
              onWorkflowFinished?.(bufferObj as WorkflowFinishedResponse)
            }
            else if (bufferObj.event === 'node_started') {
              onNodeStarted?.(bufferObj as NodeStartedResponse)
            }
            else if (bufferObj.event === 'node_finished') {
              onNodeFinished?.(bufferObj as NodeFinishedResponse)
            }
            else if (bufferObj.event === 'iteration_started') {
              onIterationStart?.(bufferObj as IterationStartedResponse)
            }
            else if (bufferObj.event === 'iteration_next') {
              onIterationNext?.(bufferObj as IterationNextResponse)
            }
            else if (bufferObj.event === 'iteration_completed') {
              onIterationFinish?.(bufferObj as IterationFinishedResponse)
            }
            else if (bufferObj.event === 'loop_started') {
              onLoopStart?.(bufferObj as LoopStartedResponse)
            }
            else if (bufferObj.event === 'loop_next') {
              onLoopNext?.(bufferObj as LoopNextResponse)
            }
            else if (bufferObj.event === 'loop_completed') {
              onLoopFinish?.(bufferObj as LoopFinishedResponse)
            }
            else if (bufferObj.event === 'node_retry') {
              onNodeRetry?.(bufferObj as NodeFinishedResponse)
            }
            else if (bufferObj.event === 'parallel_branch_started') {
              onParallelBranchStarted?.(bufferObj as ParallelBranchStartedResponse)
            }
            else if (bufferObj.event === 'parallel_branch_finished') {
              onParallelBranchFinished?.(bufferObj as ParallelBranchFinishedResponse)
            }
            else if (bufferObj.event === 'text_chunk') {
              onTextChunk?.(bufferObj as TextChunkResponse)
            }
            else if (bufferObj.event === 'text_replace') {
              onTextReplace?.(bufferObj as TextReplaceResponse)
            }
            else if (bufferObj.event === 'agent_log') {
              onAgentLog?.(bufferObj as AgentLogResponse)
            }
            else if (bufferObj.event === 'tts_message') {
              onTTSChunk?.(bufferObj.message_id, bufferObj.audio, bufferObj.audio_type)
            }
            else if (bufferObj.event === 'tts_message_end') {
              onTTSEnd?.(bufferObj.message_id, bufferObj.audio)
            }
          }
        })
        buffer = lines[lines.length - 1]
      }
      catch (e) {
        onData('', false, {
          conversationId: undefined,
          messageId: '',
          errorMessage: `${e}`,
        })
        hasError = true
        onCompleted?.(true, e instanceof Error ? e.message : String(e))
        return
      }
      if (!hasError)
        read()
    })
  }
  read()
}

const baseFetch = base

export const upload = async (options: any, isPublicAPI?: boolean, url?: string, searchParams?: string): Promise<any> => {
  const urlPrefix = isPublicAPI ? (PUBLIC_API_PREFIX || '/api') : (API_PREFIX || '/api')
  
  // Validate URL prefix
  if (!urlPrefix || typeof urlPrefix !== 'string' || urlPrefix === 'undefined' || urlPrefix === 'null') {
    console.error('Invalid URL prefix for upload:', urlPrefix)
    throw new Error('Invalid API configuration for upload')
  }
  
  const token = await getAccessToken(isPublicAPI)
  const uploadUrl = (url ? `${urlPrefix}${url}` : `${urlPrefix}/files/upload`) + (searchParams || '')
  
  // Validate constructed URL
  if (uploadUrl.includes('undefined') || uploadUrl.includes('null')) {
    console.error('Invalid upload URL:', uploadUrl)
    throw new Error('Invalid upload URL configuration')
  }
  
  const defaultOptions = {
    method: 'POST',
    url: uploadUrl,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {},
  }
  options = {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers },
  }
  return new Promise((resolve, reject) => {
    const xhr = options.xhr
    xhr.open(options.method, options.url)
    for (const key in options.headers)
      xhr.setRequestHeader(key, options.headers[key])

    xhr.withCredentials = true
    xhr.responseType = 'json'
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 201)
          resolve(xhr.response)
        else
          reject(xhr)
      }
    }
    xhr.upload.onprogress = options.onprogress
    xhr.send(options.data)
  })
}

export const ssePost = async (
  url: string,
  fetchOptions: FetchOptionType,
  otherOptions: IOtherOptions,
) => {
  const {
    isPublicAPI = false,
    onData,
    onCompleted,
    onThought,
    onFile,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onWorkflowFinished,
    onNodeStarted,
    onNodeFinished,
    onIterationStart,
    onIterationNext,
    onIterationFinish,
    onNodeRetry,
    onParallelBranchStarted,
    onParallelBranchFinished,
    onTextChunk,
    onTTSChunk,
    onTTSEnd,
    onTextReplace,
    onAgentLog,
    onError,
    getAbortController,
    onLoopStart,
    onLoopNext,
    onLoopFinish,
  } = otherOptions
  const abortController = new AbortController()

  const token = localStorage.getItem('console_token')

  const options = Object.assign({}, baseOptions, {
    method: 'POST',
    signal: abortController.signal,
    headers: new Headers({
      Authorization: `Bearer ${token}`,
    }),
    // For public APIs (cross-origin), don't send credentials
    credentials: isPublicAPI ? 'omit' : 'include',
  } as RequestInit, fetchOptions)

  const contentType = (options.headers as Headers).get('Content-Type')
  if (!contentType)
    (options.headers as Headers).set('Content-Type', ContentType.json)

  getAbortController?.(abortController)

  // Enhanced URL construction with robust validation
  let urlWithPrefix: string
  try {
    // Check if URL is already a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      urlWithPrefix = url
    } else {
      // Get the appropriate API prefix based on context
      let apiPrefix: string
      if (isPublicAPI) {
        // For public API, try to use PUBLIC_API_PREFIX first, then API_URL, then fallback
        apiPrefix = PUBLIC_API_PREFIX || API_PREFIX || '/api'
        
        // If we have a full API_URL, use it as the base
        const apiUrl = typeof API_URL === 'string' && API_URL !== 'undefined' ? API_URL : ''
        if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
          // Construct full URL from API_URL base
          const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
          urlWithPrefix = `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
        } else {
          // Use relative path with prefix
          urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`
        }
      } else {
        // For non-public API, use API_PREFIX
        apiPrefix = API_PREFIX || '/api'
        urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`
      }
    }
    
    // Validate the constructed URL
    if (!urlWithPrefix || urlWithPrefix.includes('undefined') || urlWithPrefix.includes('null')) {
      console.error('SSE URL validation failed:', {
        url,
        urlWithPrefix,
        isPublicAPI,
        PUBLIC_API_PREFIX,
        API_PREFIX,
        API_URL: typeof API_URL !== 'undefined' ? '[CONFIGURED]' : '[NOT CONFIGURED]',
      })
      onError?.('Invalid API URL configuration. Please check your environment variables.')
      return
    }
    
    // Additional validation for SSE endpoints
    console.log('SSE connection URL:', {
      endpoint: url,
      fullUrl: urlWithPrefix,
      isPublicAPI,
    })
  } catch (error) {
    console.error('Error constructing SSE URL:', error)
    onError?.('Failed to construct API URL. Please check your configuration.')
    return
  }

  const { body } = options
  if (body)
    options.body = JSON.stringify(body)

  const accessToken = await getAccessToken(isPublicAPI)
    ; (options.headers as Headers).set('Authorization', `Bearer ${accessToken}`)

  globalThis.fetch(urlWithPrefix, options as RequestInit)
    .then((res) => {
      if (!/^[23]\d{2}$/.test(String(res.status))) {
        if (res.status === 401) {
          refreshAccessTokenOrRelogin(TIME_OUT).then(() => {
            ssePost(url, fetchOptions, otherOptions)
          }).catch(() => {
            res.json().then((data: any) => {
              if (isPublicAPI) {
                if (data.code === 'web_app_access_denied')
                  requiredWebSSOLogin(data.message, 403)

                if (data.code === 'web_sso_auth_required') {
                  removeAccessToken()
                  requiredWebSSOLogin()
                }

                if (data.code === 'unauthorized') {
                  removeAccessToken()
                  // Don't reload for unauthorized - prevents infinite loops
                  console.warn('SSE connection unauthorized. Please check your API key.')
                }
              }
            })
          })
        }
        else {
          // Log the error but don't show toast for common non-critical errors
          console.log('SSE connection failed with status:', res.status)
          // Only handle fetch error for non-500 errors to avoid "Server Error" toasts
          if (res.status !== 500 && res.status !== 404) {
            handleFetchError(res)
            onError?.('Server Error')
          } else {
            // For 404 and 500, just log without showing toast
            console.log(`Non-critical ${res.status} error, suppressing toast notification`)
          }
        }
        return
      }
      return handleStream(res, (str: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => {
        if (moreInfo.errorMessage) {
          onError?.(moreInfo.errorMessage, moreInfo.errorCode)
          handleSSEError(moreInfo.errorMessage, moreInfo.errorCode)
          return
        }
        onData?.(str, isFirstMessage, moreInfo)
      },
      onCompleted,
      onThought,
      onMessageEnd,
      onMessageReplace,
      onFile,
      onWorkflowStarted,
      onWorkflowFinished,
      onNodeStarted,
      onNodeFinished,
      onIterationStart,
      onIterationNext,
      onIterationFinish,
      onLoopStart,
      onLoopNext,
      onLoopFinish,
      onNodeRetry,
      onParallelBranchStarted,
      onParallelBranchFinished,
      onTextChunk,
      onTTSChunk,
      onTTSEnd,
      onTextReplace,
      onAgentLog,
      )
    }).catch((e) => {
      // Don't show toast for generic server errors or 404s
      const errorMessage = e instanceof Error ? e.message : String(e)
      const shouldShowToast = e.toString() !== 'AbortError: The user aborted a request.' 
        && !e.toString().includes('TypeError: Cannot assign to read only property')
        && errorMessage !== 'Server Error'
        && !errorMessage.includes('404')
        && !errorMessage.includes('Failed to fetch')
      
      if (shouldShowToast)
        Toast.notify({ type: 'error', message: errorMessage })
      onError?.(e)
    })
}

// base request
export const request = async<T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  try {
    const otherOptionsForBaseFetch = otherOptions || {}
    const [err, resp] = await asyncRunSafe<T>(baseFetch(url, options, otherOptionsForBaseFetch))
    if (err === null)
      return resp
    const errResp: Response = err as any
    if (errResp.status === 401) {
      const [parseErr, errRespData] = await asyncRunSafe<ResponseError>(errResp.json())
      const loginUrl = `${globalThis.location.origin}${basePath}/signin`
      if (parseErr) {
        globalThis.location.href = loginUrl
        return Promise.reject(err)
      }
      // special code
      const { code, message } = errRespData
      // webapp sso
      if (code === 'web_app_access_denied') {
        requiredWebSSOLogin(message, 403)
        return Promise.reject(err)
      }
      if (code === 'web_sso_auth_required') {
        removeAccessToken()
        requiredWebSSOLogin()
        return Promise.reject(err)
      }
      if (code === 'unauthorized_and_force_logout') {
        localStorage.removeItem('console_token')
        localStorage.removeItem('refresh_token')
        globalThis.location.reload()
        return Promise.reject(err)
      }
      const {
        isPublicAPI = false,
        silent,
      } = otherOptionsForBaseFetch
      if (isPublicAPI && code === 'unauthorized') {
        removeAccessToken()
        // Don't reload the page for unauthorized public API calls
        // This prevents infinite reload loops when the API key is invalid
        console.warn('Public API returned unauthorized. Please check your API key configuration.')
        return Promise.reject(err)
      }
      if (code === 'init_validate_failed' && IS_CE_EDITION && !silent) {
        Toast.notify({ type: 'error', message, duration: 4000 })
        return Promise.reject(err)
      }
      if (code === 'not_init_validated' && IS_CE_EDITION) {
        globalThis.location.href = `${globalThis.location.origin}${basePath}/init`
        return Promise.reject(err)
      }
      if (code === 'not_setup' && IS_CE_EDITION) {
        globalThis.location.href = `${globalThis.location.origin}${basePath}/install`
        return Promise.reject(err)
      }

      // refresh token
      const [refreshErr] = await asyncRunSafe(refreshAccessTokenOrRelogin(TIME_OUT))
      if (refreshErr === null)
        return baseFetch<T>(url, options, otherOptionsForBaseFetch)
      if (location.pathname !== `${basePath}/signin` || !IS_CE_EDITION) {
        globalThis.location.href = loginUrl
        return Promise.reject(err)
      }
      if (!silent) {
        Toast.notify({ type: 'error', message })
        return Promise.reject(err)
      }
      globalThis.location.href = loginUrl
      return Promise.reject(err)
    }
    else {
      return Promise.reject(err)
    }
  }
  catch (error) {
    console.error('SSE request error:', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      url,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return Promise.reject(error)
  }
}

// request methods
export const get = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request<T>(url, Object.assign({}, options, { method: 'GET' }), otherOptions)
}

// For public API
export const getPublic = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return get<T>(url, options, { ...otherOptions, isPublicAPI: true })
}

// For Marketplace API
export const getMarketplace = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return get<T>(url, options, { ...otherOptions, isMarketplaceAPI: true })
}

export const post = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request<T>(url, Object.assign({}, options, { method: 'POST' }), otherOptions)
}

// For Marketplace API
export const postMarketplace = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return post<T>(url, options, { ...otherOptions, isMarketplaceAPI: true })
}

export const postPublic = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return post<T>(url, options, { ...otherOptions, isPublicAPI: true })
}

export const put = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request<T>(url, Object.assign({}, options, { method: 'PUT' }), otherOptions)
}

export const putPublic = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return put<T>(url, options, { ...otherOptions, isPublicAPI: true })
}

export const del = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request<T>(url, Object.assign({}, options, { method: 'DELETE' }), otherOptions)
}

export const delPublic = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return del<T>(url, options, { ...otherOptions, isPublicAPI: true })
}

export const patch = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request<T>(url, Object.assign({}, options, { method: 'PATCH' }), otherOptions)
}

export const patchPublic = <T>(url: string, options = {}, otherOptions?: IOtherOptions) => {
  return patch<T>(url, options, { ...otherOptions, isPublicAPI: true })
}
