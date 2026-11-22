// Workflow types for the application
// Consolidated from app/components/workflow/types.ts

export type NodeTracing = {
  node_id: string
  node_title: string
  elapsed_time: number
  execution_metadata?: {
    total_tokens?: number
    total_price?: string
    currency?: string
  }
  status: 'running' | 'success' | 'failed'
  inputs?: Record<string, any>
  outputs?: Record<string, any>
  process_data?: Record<string, any>
  error?: string
  created_at: number
  finished_at?: number
}

export type WorkflowProcess = {
  status: 'running' | 'success' | 'failed'
  tracing: NodeTracing[]
  created_at: number
  elapsed_time: number
  total_tokens?: number
  total_steps?: number
}

export type InputVarType = 'text-input' | 'select' | 'paragraph' | 'number' | 'file' | 'json' | 'singleFile' | 'multiFiles'

export const InputVarType = {
  textInput: 'text-input' as const,
  select: 'select' as const,
  paragraph: 'paragraph' as const,
  number: 'number' as const,
  file: 'file' as const,
  json: 'json' as const,
  singleFile: 'singleFile' as const,
  multiFiles: 'multiFiles' as const,
} as const

export type WorkflowRunningStatus = 'running' | 'success' | 'failed'

export const WorkflowRunningStatus = {
  Running: 'running' as const,
  Success: 'success' as const,
  Failed: 'failed' as const,
} as const

export type InputVar = {
  variable: string
  label: string
  type: InputVarType
  required: boolean
  max_length?: number
  options?: string[]
  default?: string
}

export type WorkflowStartedResponse = {
  workflow_run_id: string
  created_at: number
}

export type WorkflowFinishedResponse = {
  data: WorkflowProcess
}

export type NodeStartedResponse = {
  data: NodeTracing
}

export type NodeFinishedResponse = {
  data: NodeTracing
}

export enum SupportUploadFileTypes {
  image = 'image',
  document = 'document',
  audio = 'audio',
  video = 'video',
  custom = 'custom',
}

export const BlockEnum = {
  Start: 'start' as const,
  End: 'end' as const,
  Answer: 'answer' as const,
  LLM: 'llm' as const,
  KnowledgeRetrieval: 'knowledge-retrieval' as const,
  QuestionClassifier: 'question-classifier' as const,
  IfElse: 'if-else' as const,
  Code: 'code' as const,
  TemplateTransform: 'template-transform' as const,
  HttpRequest: 'http-request' as const,
  VariableAssigner: 'variable-assigner' as const,
  Tool: 'tool' as const,
  ParameterExtractor: 'parameter-extractor' as const,
} as const

export type BlockType = typeof BlockEnum[keyof typeof BlockEnum]

export enum TransferMethod {
  local_file = 'local_file',
  remote_url = 'remote_url',
  all = 'all',
}

export type UploadFileSetting = {
  allowed_file_upload_methods: string[]
  allowed_file_types: SupportUploadFileTypes[]
  allowed_file_extensions: string[]
  max_length: number
}
