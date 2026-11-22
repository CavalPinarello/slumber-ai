import type { AfterResponseHook, BeforeErrorHook, BeforeRequestHook, Hooks } from 'ky'
import ky from 'ky'
import type { IOtherOptions } from './base'
import { handleFetchError } from './error-handler'
import Toast from '@/app/components/base/toast'
import { API_KEY, API_PREFIX, API_URL, MARKETPLACE_API_PREFIX, PUBLIC_API_PREFIX } from '@/config'
import { getInitialTokenV2, isTokenV1 } from '@/app/components/share/utils'
import { getProcessedSystemVariablesFromUrlParams } from '@/app/utils'

const TIME_OUT = 100000

export const ContentType = {
  json: 'application/json',
  stream: 'text/event-stream',
  audio: 'audio/mpeg',
  form: 'application/x-www-form-urlencoded; charset=UTF-8',
  download: 'application/octet-stream', // for download
  downloadZip: 'application/zip', // for download
  upload: 'multipart/form-data', // for upload
}

export type FetchOptionType = Omit<RequestInit, 'body'> & {
  params?: Record<string, any>
  body?: BodyInit | Record<string, any> | null
}

const afterResponse204: AfterResponseHook = async (_request, _options, response) => {
  if (response.status === 204)
    return Response.json({ result: 'success' })
}

export type ResponseError = {
  code: string
  message: string
  status: number
}

const afterResponseErrorCode = (otherOptions: IOtherOptions): AfterResponseHook => {
  return async (_request, _options, response) => {
    const clonedResponse = response.clone()
    if (!/^([23])\d{2}$/.test(String(clonedResponse.status))) {
      let bodyJson: Promise<ResponseError>
      try {
        bodyJson = clonedResponse.json() as Promise<ResponseError>
      }
      catch (error) {
        // If response is not JSON, create a default error response
        const text = await clonedResponse.text()
        bodyJson = Promise.resolve({
          code: 'response_error',
          message: `Server error: ${text || 'Unknown error'}`,
          status: clonedResponse.status,
        })
      }
      switch (clonedResponse.status) {
        case 403:
          bodyJson.then((data: ResponseError) => {
            if (data.code === 'already_setup')
              globalThis.location.href = `${globalThis.location.origin}/signin`
          })
          handleFetchError(clonedResponse, { silent: otherOptions.silent })
          break
        case 401:
          return Promise.reject(response)
        // fall through
        default:
          handleFetchError(clonedResponse, { silent: otherOptions.silent })
          return Promise.reject(response)
      }
    }
  }
}

const beforeErrorToast = (otherOptions: IOtherOptions): BeforeErrorHook => {
  return (error) => {
    if (!otherOptions.silent)
      Toast.notify({ type: 'error', message: error.message })
    return error
  }
}

export async function getAccessToken(isPublicAPI?: boolean) {
  if (isPublicAPI) {
    // First check if we have a direct API key from environment variables
    if (API_KEY && API_KEY !== 'undefined') {
      return API_KEY
    }
    
    // Fallback to shared token logic for embedded apps
    const sharedToken = globalThis.location.pathname.split('/').slice(-1)[0]
    const userId = (await getProcessedSystemVariablesFromUrlParams()).user_id
    const accessToken = localStorage.getItem('token') || JSON.stringify({ version: 2 })
    let accessTokenJson: Record<string, any> = { version: 2 }
    try {
      accessTokenJson = JSON.parse(accessToken)
      if (isTokenV1(accessTokenJson))
        accessTokenJson = getInitialTokenV2()
    }
    catch {

    }
    return accessTokenJson[sharedToken]?.[userId || 'DEFAULT']
  }
  else {
    return localStorage.getItem('console_token') || ''
  }
}

const beforeRequestPublicAuthorization: BeforeRequestHook = async (request) => {
  const token = await getAccessToken(true)
  request.headers.set('Authorization', `Bearer ${token}`)
}

const beforeRequestAuthorization: BeforeRequestHook = async (request) => {
  const accessToken = await getAccessToken()
  request.headers.set('Authorization', `Bearer ${accessToken}`)
}

const baseHooks: Hooks = {
  afterResponse: [
    afterResponse204,
  ],
}

const baseClient = ky.create({
  hooks: baseHooks,
  timeout: TIME_OUT,
})

export const baseOptions: RequestInit = {
  method: 'GET',
  mode: 'cors',
  credentials: 'include', // default, but will be overridden for public APIs
  headers: new Headers({
    'Content-Type': ContentType.json,
  }),
  redirect: 'follow',
}

async function base<T>(url: string, options: FetchOptionType = {}, otherOptions: IOtherOptions = {}): Promise<T> {
  const { params, body, headers, ...init } = Object.assign({}, baseOptions, options)
  const {
    isPublicAPI = false,
    isMarketplaceAPI = false,
    bodyStringify = true,
    needAllResponseContent,
    deleteContentType,
    getAbortController,
  } = otherOptions

  let base: string
  if (isMarketplaceAPI) {
    base = MARKETPLACE_API_PREFIX || 'https://marketplace.dify.ai/api/v1'
  }
  else if (isPublicAPI) {
    // For public API, check if we have a full API_URL
    const apiUrl = typeof API_URL === 'string' && API_URL !== 'undefined' ? API_URL : ''
    if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
      // Use the full API_URL if available
      base = apiUrl
    } else {
      // Otherwise use the PUBLIC_API_PREFIX
      base = PUBLIC_API_PREFIX || API_PREFIX || '/api'
    }
  }
  else {
    base = API_PREFIX || '/api'
  }

  // Validate base URL prefix
  if (!base || typeof base !== 'string' || base === 'undefined' || base === 'null') {
    console.error('Invalid API configuration:', {
      base,
      isPublicAPI,
      isMarketplaceAPI,
      API_URL: typeof API_URL !== 'undefined' ? '[CONFIGURED]' : '[NOT CONFIGURED]',
      PUBLIC_API_PREFIX,
      API_PREFIX,
    })
    throw new Error('Invalid API configuration. Please check your environment variables.')
  }

  if (getAbortController) {
    const abortController = new AbortController()
    getAbortController(abortController)
    options.signal = abortController.signal
  }

  // Construct the fetch pathname
  let fetchPathname: string
  if (base.startsWith('http://') || base.startsWith('https://')) {
    // If base is a full URL, construct appropriately
    const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base
    const endpoint = url.startsWith('/') ? url : `/${url}`
    // Don't add /api if it's already in the base URL
    if (baseUrl.includes('/api') || baseUrl.includes('/v1')) {
      fetchPathname = `${baseUrl}${endpoint}`
    } else {
      fetchPathname = `${baseUrl}/api${endpoint}`
    }
  } else {
    // If base is a relative path
    fetchPathname = base + (url.startsWith('/') ? url : `/${url}`)
  }
  
  // Validate constructed pathname
  if (fetchPathname.includes('undefined') || fetchPathname.includes('null')) {
    console.error('Invalid URL construction:', {
      url,
      base,
      fetchPathname,
      isPublicAPI,
    })
    throw new Error('Invalid URL configuration. Please check your environment variables.')
  }
  
  console.log('Fetch URL constructed:', {
    endpoint: url,
    fullUrl: fetchPathname,
    isPublicAPI,
  })

  if (deleteContentType)
    (headers as any).delete('Content-Type')

  const client = baseClient.extend({
    hooks: {
      ...baseHooks,
      beforeError: [
        ...baseHooks.beforeError || [],
        beforeErrorToast(otherOptions),
      ],
      beforeRequest: [
        ...baseHooks.beforeRequest || [],
        isPublicAPI && beforeRequestPublicAuthorization,
        !isPublicAPI && !isMarketplaceAPI && beforeRequestAuthorization,
      ].filter(Boolean),
      afterResponse: [
        ...baseHooks.afterResponse || [],
        afterResponseErrorCode(otherOptions),
      ],
    },
  })

  const res = await client(fetchPathname, {
    ...init,
    headers,
    credentials: isMarketplaceAPI || isPublicAPI
      ? 'omit'
      : (options.credentials || 'include'),
    retry: {
      methods: [],
    },
    ...(bodyStringify ? { json: body } : { body: body as BodyInit }),
    searchParams: params,
    fetch(resource: RequestInfo | URL, options?: RequestInit) {
      if (resource instanceof Request && options) {
        const mergedHeaders = new Headers(options.headers || {})
        resource.headers.forEach((value, key) => {
          mergedHeaders.append(key, value)
        })
        options.headers = mergedHeaders
      }
      return globalThis.fetch(resource, options)
    },
  })

  if (needAllResponseContent)
    return res as T
  const contentType = res.headers.get('content-type')
  if (
    contentType
    && [ContentType.download, ContentType.audio, ContentType.downloadZip].includes(contentType)
  )
    return await res.blob() as T

  try {
    return await res.json() as T
  }
  catch (error) {
    // If response is not JSON, return the text content
    console.error('Failed to parse JSON response:', error)
    const text = await res.text()
    throw new Error(`Invalid JSON response: ${text}`)
  }
}

export { base }

export enum ModelModeType {
  chat = 'chat',
  completion = 'completion',
  unset = 'unset',
}
