import type { Locale } from '@/i18n'

// Re-export from consolidated types
export type { PromptVariable } from './chat'

export type PromptConfig = {
  prompt_template: string
  prompt_variables: PromptVariable[]
}

export type TextTypeFormItem = {
  label: string
  variable: string
  required: boolean
  max_length: number
}

export type SelectTypeFormItem = {
  label: string
  variable: string
  required: boolean
  options: string[]
}
/**
 * User Input Form Item
 */
export type UserInputFormItem = {
  'text-input': TextTypeFormItem
} | {
  'select': SelectTypeFormItem
} | {
  'paragraph': TextTypeFormItem
}

// Re-export from consolidated types
export const MessageRatings = ['like', 'dislike', null] as const
export type MessageRating = typeof MessageRatings[number]
export type { FeedbackType as Feedbacktype, MessageMore } from './chat'

// Re-export from consolidated types with local extensions
export type { IChatItem as IChatItemBase } from './chat'

export type IChatItem = IChatItemBase & {
  /**
   * The admin feedback result of this message
   */
  adminFeedback?: Feedbacktype
  /**
   * Whether to hide the feedback area
   */
  feedbackDisabled?: boolean
}

export type ChatItem = IChatItem & {
  isError?: boolean
  workflow_run_id?: string
  workflowProcess?: WorkflowProcess
}

export type ResponseHolder = {}

// Re-export from consolidated types
export type { ConversationItem } from './chat'

export type AppInfo = {
  title: string
  description: string
  default_language: Locale
  copyright?: string
  privacy_policy?: string
}

export type DifyAppInfo = {
  name: string
  description: string
  tags: string[]
}

export type DifyAppSiteInfo = {
  title: string
  chat_color_theme: string | null
  chat_color_theme_inverted: boolean
  icon_type: 'emoji' | 'image'
  icon: string
  icon_background: string
  icon_url: string | null
  description: string
  copyright: string
  privacy_policy: string | null
  custom_disclaimer: string
  default_language: string
  show_workflow_steps: boolean
  use_icon_as_answer_icon: boolean
}

export enum Resolution {
  low = 'low',
  high = 'high',
}

export enum TransferMethod {
  all = 'all',
  local_file = 'local_file',
  remote_url = 'remote_url',
}

export type VisionSettings = {
  enabled: boolean
  number_limits: number
  detail: Resolution
  transfer_methods: TransferMethod[]
  image_file_size_limit?: number | string
}

export type ImageFile = {
  type: TransferMethod
  _id: string
  fileId: string
  file?: File
  progress: number
  url: string
  base64Url?: string
  deleted?: boolean
}

export type VisionFile = {
  id?: string
  type: string
  transfer_method: TransferMethod
  url: string
  upload_file_id: string
  belongs_to?: string
}

export enum BlockEnum {
  Start = 'start',
  End = 'end',
  Answer = 'answer',
  LLM = 'llm',
  KnowledgeRetrieval = 'knowledge-retrieval',
  QuestionClassifier = 'question-classifier',
  IfElse = 'if-else',
  Code = 'code',
  TemplateTransform = 'template-transform',
  HttpRequest = 'http-request',
  VariableAssigner = 'variable-assigner',
  Tool = 'tool',
}

export type NodeTracing = {
  id: string
  index: number
  predecessor_node_id: string
  node_id: string
  node_type: BlockEnum
  title: string
  inputs: any
  process_data: any
  outputs?: any
  status: string
  error?: string
  elapsed_time: number
  execution_metadata: {
    total_tokens: number
    total_price: number
    currency: string
  }
  created_at: number
  created_by: {
    id: string
    name: string
    email: string
  }
  finished_at: number
  extras?: any
  expand?: boolean // for UI
}

export enum NodeRunningStatus {
  NotStart = 'not-start',
  Waiting = 'waiting',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export enum WorkflowRunningStatus {
  Waiting = 'waiting',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Stopped = 'stopped',
}

export type WorkflowProcess = {
  status: WorkflowRunningStatus
  tracing: NodeTracing[]
  expand?: boolean // for UI
}

export enum CodeLanguage {
  python3 = 'python3',
  javascript = 'javascript',
  json = 'json',
}

export enum ModelModeType {
  chat = 'chat',
  completion = 'completion',
  unset = 'unset',
}

export enum RETRIEVE_TYPE {
  oneWay = 'one_way',
  multiWay = 'multi_way',
}

export enum RETRIEVE_METHOD {
  oneWay = 'one_way',
  multiWay = 'multi_way',
  keywordSearch = 'keyword_search',
  invertedIndex = 'inverted_index',
}

export type RetrievalConfig = {
  search_method: string
  top_k: number
  score_threshold: number
  score_threshold_enabled?: boolean
}

export enum AppType {
  chat = 'chat',
  agent = 'agent',
  workflow = 'workflow',
  completion = 'completion',
}

export enum TtsAutoPlay {
  enabled = 'enabled',
  disabled = 'disabled',
}

export const ALLOW_FILE_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  document: ['txt', 'md', 'pdf', 'html', 'htm', 'docx'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'flv'],
  spreadsheet: ['csv', 'xls', 'xlsx'],
  presentation: ['ppt', 'pptx'],
  archive: ['zip', 'tar', 'gz', '7z', 'rar'],
  code: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'kt', 'swift'],
}

export enum Theme {
  light = 'light',
  dark = 'dark',
  system = 'system',
}
