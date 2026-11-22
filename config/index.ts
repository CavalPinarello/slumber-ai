import type { AppInfo } from '@/types/app'

// Safely get environment variables - direct access without throwing errors
export const APP_ID = process.env.NEXT_PUBLIC_APP_ID || ''
export const API_KEY = process.env.NEXT_PUBLIC_APP_KEY || ''
export const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Debug logging for environment variables
console.log('Environment variables loaded in config:', {
  APP_ID: APP_ID || '[NOT SET]',
  API_KEY: API_KEY ? `${API_KEY.substring(0, 10)}...` : '[NOT SET]',
  API_URL: API_URL || '[NOT SET]',
  RAW_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
  RAW_API_KEY: process.env.NEXT_PUBLIC_APP_KEY ? `${process.env.NEXT_PUBLIC_APP_KEY.substring(0, 10)}...` : '[NOT SET]',
  RAW_API_URL: process.env.NEXT_PUBLIC_API_URL,
  IS_SERVER: typeof window === 'undefined',
})

// Public API prefix with validation
export const PUBLIC_API_PREFIX = (() => {
  const url = API_URL
  if (!url || url === 'undefined' || url === 'null')
    return '/api'
  try {
    // If it's a full URL, extract the API path
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url)
      return urlObj.pathname === '/' ? '/api' : urlObj.pathname
    }
    // If it's already a path, use it
    return url.startsWith('/') ? url : `/${url}`
  }
  catch (error) {
    console.error('Invalid API_URL format:', url, error)
    return '/api'
  }
})()

export const APP_INFO: AppInfo = {
  title: 'Chat APP',
  description: '',
  copyright: '',
  privacy_policy: process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL || '',
  default_language: 'en',
}

export const isShowPrompt = false
export const promptTemplate = 'I want you to act as a javascript console.'

export const API_PREFIX = '/api'

// Validate configuration on module load
export const validateConfiguration = () => {
  const errors: string[] = []
  
  if (!APP_ID || APP_ID === 'undefined')
    errors.push('NEXT_PUBLIC_APP_ID is not configured')
  
  if (!API_KEY || API_KEY === 'undefined')
    errors.push('NEXT_PUBLIC_APP_KEY is not configured')
  
  if (!API_URL || API_URL === 'undefined')
    errors.push('NEXT_PUBLIC_API_URL is not configured')
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors)
    return { valid: false, errors }
  }
  
  return { valid: true, errors: [] }
}

// Export other existing configuration constants

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48

export const MAX_VAR_KEY_LENGTH = 30

export const VAR_ITEM_TEMPLATE = {
  key: '',
  name: '',
  type: 'string',
  required: true,
  max_length: DEFAULT_VALUE_MAX_LEN,
}

export const VAR_ITEM_TEMPLATE_IN_WORKFLOW = {
  key: '',
  name: '',
  type: 'string',
  required: true,
}

export const getMaxVarNameLength = (key: string) => {
  return Math.min(key.length, MAX_VAR_KEY_LENGTH)
}

export const MAX_PROMPT_MESSAGE_LENGTH = 2000

export const VAR_REGEX = /{{([a-zA-Z_][a-zA-Z0-9_]*)}}/g

export const WORKFLOW_DATA_UPDATE_EVENT_EMITTER = 'workflow-data-update'

export const QUEUE_LENGTH_LIMIT = 100

export const CONTEXT_PROMPT_TEMPLATE = 'I want you to act as a javascript console.'

// Missing constants that are imported from @/config
export const MAX_TOOLS_NUM = parseInt(process.env.NEXT_PUBLIC_MAX_TOOLS_NUM || '10', 10)
export const MARKETPLACE_URL_PREFIX = process.env.NEXT_PUBLIC_MARKETPLACE_URL_PREFIX || 'https://marketplace.dify.ai'
export const MARKETPLACE_API_PREFIX = process.env.NEXT_PUBLIC_MARKETPLACE_API_PREFIX || 'https://marketplace.dify.ai/api/v1'
export const IS_CE_EDITION = true
export const IS_CLOUD_EDITION = false
export const TEXT_GENERATION_TIMEOUT_MS = parseInt(process.env.NEXT_PUBLIC_TEXT_GENERATION_TIMEOUT_MS || '60000', 10)
export const FULL_DOC_PREVIEW_LENGTH = 2000
export const JSON_SCHEMA_MAX_DEPTH = 5
export const LOOP_NODE_MAX_COUNT = parseInt(process.env.NEXT_PUBLIC_LOOP_NODE_MAX_COUNT || '10', 10)
export const TONE_LIST = [
  { id: 'creative', name: 'Creative' },
  { id: 'balanced', name: 'Balanced' },
  { id: 'precise', name: 'Precise' },
]
export const emailRegex = /^[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}$/
export const appDefaultIconBackground = '#D1D5DB'
export const NEED_REFRESH_APP_LIST_KEY = 'need_refresh_app_list'
export const apiPrefix = '/api'
export const marketplaceApiPrefix = 'https://marketplace.dify.ai/api/v1'
export const SUPPORT_INSTALL_LOCAL_FILE_EXTENSIONS = ['.zip', '.tar', '.tar.gz']
export const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN || ''
export const marketplaceUrlPrefix = 'https://marketplace.dify.ai'
export const ENABLE_WEBSITE_FIRECRAWL = process.env.NEXT_PUBLIC_ENABLE_WEBSITE_FIRECRAWL === 'true'
export const ENABLE_WEBSITE_JINAREADER = process.env.NEXT_PUBLIC_ENABLE_WEBSITE_JINAREADER === 'true'
export const ENABLE_WEBSITE_WATERCRAWL = process.env.NEXT_PUBLIC_ENABLE_WEBSITE_WATERCRAWL === 'true'
export const resetReg = () => {
  VAR_REGEX.lastIndex = 0
}

// Conversation title configuration
export const REMOVE_EMOJIS_FROM_TITLES = process.env.NEXT_PUBLIC_REMOVE_EMOJIS_FROM_TITLES !== 'false'

export const ANNOTATION_DEFAULT = {
  score_threshold: 0.5,
}

export const DATASET_DEFAULT = {
  top_k: 3,
  score_threshold: 0.5,
  enabled: true,
}

export const DEFAULT_AGENT_SETTING = {
  enabled: false,
  max_iteration: 5,
  strategy: 'function_call',
  tools: [],
}

export const DEFAULT_CHAT_PROMPT_CONFIG = {
  prompt: [
    {
      role: 'system',
      text: 'You are a helpful assistant.',
    },
  ],
}

export const DEFAULT_COMPLETION_PROMPT_CONFIG = {
  prompt: {
    text: 'You are a helpful assistant.',
  },
}

export const DEFAULT_AGENT_PROMPT = {
  chat: 'You are a helpful AI assistant.',
  completion: 'You are a helpful AI assistant.',
}
