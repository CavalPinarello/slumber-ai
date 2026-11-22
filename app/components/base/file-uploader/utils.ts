// Re-export from centralized file handling utilities
// Local imports for specific file uploader functionality
import type { FileEntity } from './types'
import type { FileResponse } from '@/types/workflow'
import { TransferMethod } from '@/types/app'
import { SupportUploadFileTypes } from '@/app/components/workflow/types'

export {
  fileUpload,
  getFileExtension,
  getFileAppearanceType,
  getSupportFileType,
  downloadFile,
  validateFileType,
  formatFileSize,
  FILE_EXTS,
} from '@/utils/file-handling'
export type { FileUploadParams, FileUploadOptions } from '@/utils/file-handling'

/**
 * Legacy function for backward compatibility - use getSupportFileType from utils instead
 */
export const getSupportFileTypeCompat = (fileName: string, fileMimetype: string, isCustom?: boolean) => {
  if (isCustom)
    return SupportUploadFileTypes.custom

  const { getFileExtension, FILE_EXTS } = require('@/utils/file-handling')
  const extension = getFileExtension(fileName, fileMimetype)

  for (const key in FILE_EXTS) {
    if ((FILE_EXTS[key]).includes(extension.toUpperCase()))
      return key
  }

  return ''
}

/**
 * Process file entities for upload
 */
export const getProcessedFiles = (files: FileEntity[]) => {
  return files.filter(file => file.progress !== -1).map(fileItem => ({
    type: fileItem.supportFileType,
    transfer_method: fileItem.transferMethod,
    url: fileItem.url || '',
    upload_file_id: fileItem.uploadedId || '',
  }))
}

/**
 * Process file responses into FileEntity format
 */
export const getProcessedFilesFromResponse = (files: FileResponse[]) => {
  return files.map((fileItem) => {
    return {
      id: fileItem.related_id,
      name: fileItem.filename,
      size: fileItem.size || 0,
      type: fileItem.mime_type,
      progress: 100,
      transferMethod: fileItem.transfer_method,
      supportFileType: fileItem.type,
      uploadedId: fileItem.upload_file_id || fileItem.related_id,
      url: fileItem.url,
    }
  })
}

/**
 * Extract filename from URL
 */
export const getFileNameFromUrl = (url: string) => {
  const urlParts = url.split('/')
  return urlParts[urlParts.length - 1] || ''
}

/**
 * Get supported file extension list
 */
export const getSupportFileExtensionList = (allowFileTypes: string[], allowFileExtensions: string[]) => {
  if (allowFileTypes.includes(SupportUploadFileTypes.custom))
    return allowFileExtensions.map(item => item.slice(1).toUpperCase())

  const { FILE_EXTS } = require('@/utils/file-handling')
  return allowFileTypes.map(type => FILE_EXTS[type]).flat()
}

/**
 * Check if file extension is allowed
 */
export const isAllowedFileExtension = (fileName: string, fileMimetype: string, allowFileTypes: string[], allowFileExtensions: string[]) => {
  const { getFileExtension } = require('@/utils/file-handling')
  return getSupportFileExtensionList(allowFileTypes, allowFileExtensions).includes(getFileExtension(fileName, fileMimetype).toUpperCase())
}

/**
 * Extract files from log data
 */
export const getFilesInLogs = (rawData: any) => {
  const result = Object.keys(rawData || {}).map((key) => {
    if (typeof rawData[key] === 'object' && rawData[key]?.dify_model_identity === '__dify__file__') {
      return {
        varName: key,
        list: getProcessedFilesFromResponse([rawData[key]]),
      }
    }
    if (Array.isArray(rawData[key]) && rawData[key].some(item => item?.dify_model_identity === '__dify__file__')) {
      return {
        varName: key,
        list: getProcessedFilesFromResponse(rawData[key]),
      }
    }
    return undefined
  }).filter(Boolean)
  return result
}

/**
 * Check if file has been uploaded
 */
export const fileIsUploaded = (file: FileEntity) => {
  if (file.uploadedId)
    return true

  if (file.transferMethod === TransferMethod.remote_url && file.progress === 100)
    return true

  return false
}

/**
 * Validate file entity before sending to API
 */
export const validateFileEntity = (file: FileEntity): { valid: boolean; error?: string } => {
  // Check if file has required properties
  if (!file)
    return { valid: false, error: 'File object is missing' }

  // Check if file has been uploaded (has an ID)
  if (file.transferMethod === TransferMethod.local_file && !file.uploadedId)
    return { valid: false, error: 'File has not been uploaded yet' }

  // Check if remote URL is provided for remote files
  if (file.transferMethod === TransferMethod.remote_url && !file.url)
    return { valid: false, error: 'Remote file URL is missing' }

  // Check if file type is valid
  const validTypes = ['image', 'audio', 'video', 'document']
  if (file.supportFileType && !validTypes.includes(file.supportFileType) && file.supportFileType !== 'custom')
    return { valid: false, error: `Invalid file type: ${file.supportFileType}` }

  return { valid: true }
}

/**
 * Sanitize file entity for API submission
 */
export const sanitizeFileForAPI = (file: any): any => {
  const sanitized: any = {
    type: file.type || 'document',
    transfer_method: file.transfer_method || 'local_file',
  }

  // Validate and normalize file type
  const validTypes = ['image', 'audio', 'video', 'document']
  if (!validTypes.includes(sanitized.type)) {
    console.warn(`Invalid file type '${sanitized.type}' - defaulting to 'document'`)
    sanitized.type = 'document'
  }

  // Map 'custom' type to 'document' for Dify compatibility
  if (sanitized.type === 'custom')
    sanitized.type = 'document'

  // Only include upload_file_id for local files
  if (sanitized.transfer_method === 'local_file') {
    // Validate upload_file_id exists and is valid
    if (file.upload_file_id && file.upload_file_id !== 'undefined' && file.upload_file_id !== 'null') {
      sanitized.upload_file_id = file.upload_file_id
    }
    else {
      console.error('Local file missing valid upload_file_id:', file)
      return null // Invalid file
    }
  }

  // Only include URL for remote files
  if (sanitized.transfer_method === 'remote_url') {
    if (file.url && file.url !== '') {
      sanitized.url = file.url
    }
    else {
      console.error('Remote file missing URL:', file)
      return null // Invalid file
    }
  }

  // Remove any undefined or null values
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined || sanitized[key] === null || sanitized[key] === '')
      delete sanitized[key]
  })

  return sanitized
}
