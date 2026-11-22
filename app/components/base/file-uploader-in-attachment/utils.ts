// Re-export from centralized file handling utilities
// Local imports for attachment-specific functionality
import type { FileEntity, FileResponse } from './types'
import { TransferMethod } from '@/types/app'

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
 * Simple file upload wrapper for attachment context
 */
export const attachmentFileUpload = (params: {
  file: File
  onProgressCallback: (progress: number) => void
  onSuccessCallback: (res: { id: string }) => void
  onErrorCallback: () => void
}) => {
  const { fileUpload } = require('@/utils/file-handling')
  return fileUpload(params, { isPublic: false })
}

/**
 * Process files for attachment upload
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
 * Process file responses into FileEntity format for attachments
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
 * Extract filename from URL
 */
export const getFileNameFromUrl = (url: string) => {
  const urlParts = url.split('/')
  return urlParts[urlParts.length - 1] || ''
}
