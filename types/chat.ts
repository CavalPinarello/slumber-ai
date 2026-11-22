// Consolidated chat-related type definitions

// Import necessary types from other modules
import type { AgentThought } from '@/app/components/base/chat/chat/type'
import type { VisionFile } from '@/types/app'
import type { AnnotationReply } from '@/app/components/base/chat/chat/type'
import type { Log } from '@/types/log'
import type { InputVarType, WorkflowProcess } from '@/types/workflow'

export type MessageMore = {
  time: string
  tokens: number
  latency: number | string
}

export type FeedbackType = {
  rating: 'like' | 'dislike' | null
  content?: string | null
}

export enum AnnotationReplyStatus {
  Wait = 'wait',
  Annotating = 'annotating',
}

export type MessageRating = {
  like: boolean
  hate: boolean
}

export type IChatItem = {
  id: string
  content: string
  agent_thoughts?: AgentThought[]
  message_files?: VisionFile[]
  feedback?: FeedbackType
  isAnswer: boolean
  message_id?: string
  conversation_id?: string
  more?: MessageMore
  annotation?: AnnotationReply
  useCurrentUserAvatar?: boolean
  isOpeningStatement?: boolean
  suggestedQuestions?: string[]
  log?: Log[]
  workflowProcess?: WorkflowProcess
  message_price?: string
}

export type ConversationItem = {
  id: string
  name: string
  inputs: Record<string, any> | null
  introduction: string
  created_at: number
  updated_at?: number
  status?: string
  suggested_questions?: string[]
}

export type PromptVariable = {
  key: string
  name: string
  type: InputVarType
  default?: string | number
  required?: boolean
  options?: string[]
  max_length?: number
  label?: string
}
