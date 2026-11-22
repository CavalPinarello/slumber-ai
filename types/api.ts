// Consolidated API-related type definitions

/**
 * Generic API response wrapper
 */
// Import types from other modules
import type { ConversationItem, IChatItem } from './chat'
import type { App } from '@/types/app'

export type ApiResponse<T = any> = {
  data: T
  success: boolean
  message?: string
  code?: string
}

/**
 * Paginated API response
 */
export type PaginatedResponse<T> = {
  data: T[]
  has_more: boolean
  limit: number
  page?: number
  total?: number
  first_id?: string
  last_id?: string
}

/**
 * Common API error structure
 */
export type ApiError = {
  code: string
  message: string
  status: number
  details?: any
}

/**
 * Response error type for fetch operations
 */
export type ResponseError = {
  code: string
  message: string
  status?: number
}

/**
 * Common result response
 */
export type CommonResponse = {
  result: 'success' | 'fail'
  message?: string
}

/**
 * File upload response
 */
export type FileUploadResponse = {
  id: string
  name?: string
  size?: number
  url?: string
  type?: string
}

/**
 * Generic list response
 */
export type ListResponse<T> = {
  data: T[]
  total?: number
  page?: number
  limit?: number
  has_more?: boolean
}

/**
 * App-specific response types
 */
export type AppListResponse = {} & PaginatedResponse<App>

export type ConversationListResponse = {} & PaginatedResponse<ConversationItem>

export type MessageListResponse = {} & PaginatedResponse<IChatItem>
