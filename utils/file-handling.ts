import mime from 'mime'
import { FileAppearanceTypeEnum } from '@/app/components/base/icons/file-type-icon'
import type { FileAppearanceType } from '@/app/components/base/icons/file-type-icon'
import { upload } from '@/service/base'

// File extensions mapping - aligned with Dify API requirements
const FILE_EXTS = {
  image: ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG', 'BMP', 'ICO'],
  video: ['MP4', 'MOV', 'AVI', 'WEBM', 'MKV', 'FLV', 'WMV'],
  audio: ['MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A', 'WMA'],
  document: ['TXT', 'MD', 'MDX', 'MARKDOWN', 'PDF', 'HTML', 'HTM', 'XLSX', 'XLS', 'DOC', 'DOCX', 'CSV', 'TSV', 'EML', 'MSG', 'PPTX', 'PPT', 'XML', 'EPUB', 'RTF', 'JSON', 'YAML', 'YML', 'LOG'],
}

// Additional extension mapping for special mime types
const additionalExtensionMap = new Map<string, string[]>([
  ['text/x-markdown', ['md']],
])

// File upload types
type FileUploadParams = {
  file: File
  onProgressCallback: (progress: number) => void
  onSuccessCallback: (res: { id: string }) => void
  onErrorCallback: () => void
}

type FileUploadOptions = {
  isPublic?: boolean
  url?: string
}

/**
 * Unified file upload function with progress tracking
 */
export const fileUpload = (
  params: FileUploadParams,
  options: FileUploadOptions = {},
): void => {
  const { file, onProgressCallback, onSuccessCallback, onErrorCallback } = params
  const { isPublic, url } = options

  const formData = new FormData()
  formData.append('file', file)

  const onProgress = (e: ProgressEvent) => {
    if (e.lengthComputable) {
      const percent = Math.floor((e.loaded / e.total) * 100)
      onProgressCallback(percent)
    }
  }

  const uploadOptions = isPublic !== undefined && url !== undefined
    ? { isPublic, url }
    : undefined

  upload({
    xhr: new XMLHttpRequest(),
    data: formData,
    onprogress: onProgress,
  }, uploadOptions?.isPublic, uploadOptions?.url)
    .then((res: { id: string }) => {
      onSuccessCallback(res)
    })
    .catch(() => {
      onErrorCallback()
    })
}

/**
 * Enhanced file extension detection with comprehensive mime type support
 */
export const getFileExtension = (
  fileName: string,
  fileMimetype: string,
  isRemote?: boolean,
): string => {
  let extension = ''
  let extensions = new Set<string>()

  // Get extensions from mime type
  if (fileMimetype) {
    const extensionsFromMimeType = mime.getAllExtensions(fileMimetype) || new Set<string>()
    const additionalExtensions = additionalExtensionMap.get(fileMimetype) || []
    extensions = new Set<string>([
      ...extensionsFromMimeType,
      ...additionalExtensions,
    ])
  }

  // Extract extension from filename
  let extensionInFileName = ''
  if (fileName) {
    const fileNamePair = fileName.split('.')
    const fileNamePairLength = fileNamePair.length

    if (fileNamePairLength > 1) {
      extensionInFileName = fileNamePair[fileNamePairLength - 1].toLowerCase()
      if (extensions.has(extensionInFileName))
        extension = extensionInFileName
    }
  }

  // Fallback to first available extension from mime type
  if (!extension) {
    if (extensions.size > 0)
      extension = extensions.values().next().value.toLowerCase()
    else
      extension = extensionInFileName
  }

  // Remote files don't have extensions
  if (isRemote)
    extension = ''

  return extension
}

/**
 * Simplified file extension detection for basic use cases
 */
export const getSimpleFileExtension = (
  fileName: string,
  fileMimetype: string,
  isRemote?: boolean,
): string => {
  let extension = ''

  if (fileMimetype)
    extension = mime.getExtension(fileMimetype) || ''

  if (fileName && !extension) {
    const fileNamePair = fileName.split('.')
    const fileNamePairLength = fileNamePair.length

    if (fileNamePairLength > 1)
      extension = fileNamePair[fileNamePairLength - 1]
    else
      extension = ''
  }

  if (isRemote)
    extension = ''

  return extension
}

/**
 * Determine file appearance type based on extension and mime type
 */
export const getFileAppearanceType = (
  fileName: string,
  fileMimetype: string,
  useSimpleExtraction = false,
): FileAppearanceType => {
  const extension = useSimpleExtraction
    ? getSimpleFileExtension(fileName, fileMimetype)
    : getFileExtension(fileName, fileMimetype)

  // Special cases
  if (extension === 'gif')
    return FileAppearanceTypeEnum.gif
  if (extension === 'html')
    return FileAppearanceTypeEnum.code
  if (extension === 'pdf')
    return FileAppearanceTypeEnum.pdf

  // Markdown files
  if (['md', 'markdown', 'mdx'].includes(extension))
    return FileAppearanceTypeEnum.markdown

  // Office files
  if (['xlsx', 'xls'].includes(extension))
    return FileAppearanceTypeEnum.excel
  if (['docx', 'doc'].includes(extension))
    return FileAppearanceTypeEnum.word
  if (['pptx', 'ppt'].includes(extension))
    return FileAppearanceTypeEnum.ppt

  // Media files
  if (FILE_EXTS.image.includes(extension.toUpperCase()))
    return FileAppearanceTypeEnum.image

  if (FILE_EXTS.video.includes(extension.toUpperCase()))
    return FileAppearanceTypeEnum.video

  if (FILE_EXTS.audio.includes(extension.toUpperCase()))
    return FileAppearanceTypeEnum.audio

  if (FILE_EXTS.document.includes(extension.toUpperCase()))
    return FileAppearanceTypeEnum.document

  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(extension))
    return FileAppearanceTypeEnum.code

  // Default to document
  return FileAppearanceTypeEnum.document
}

/**
 * Get supported file type for upload validation
 */
export const getSupportFileType = (extension: string): string => {
  if (!extension) {
    console.warn('No extension provided for file type detection')
    return 'document' // Default to document instead of custom
  }

  const upperExt = extension.toUpperCase()

  if (FILE_EXTS.image.includes(upperExt))
    return 'image'
  if (FILE_EXTS.video.includes(upperExt))
    return 'video'
  if (FILE_EXTS.audio.includes(upperExt))
    return 'audio'
  if (FILE_EXTS.document.includes(upperExt))
    return 'document'

  // Log unknown extensions for debugging
  console.warn(`Unknown file extension '${extension}' - defaulting to 'document' type`)
  return 'document' // Default to document instead of custom for better Dify compatibility
}

/**
 * Download file with proper filename handling
 */
export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Validate file type against allowed types with enhanced validation
 */
export const validateFileType = (
  file: File,
  allowedTypes: string[],
  allowedExtensions: string[],
): boolean => {
  // Basic file validation
  if (!file || !file.name) {
    console.error('Invalid file object:', file)
    return false
  }

  // Check file size (max 10MB)
  const maxFileSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxFileSize) {
    console.error(`File size ${file.size} exceeds maximum allowed size of ${maxFileSize} bytes`)
    return false
  }

  const extension = getFileExtension(file.name, file.type)
  const fileType = getSupportFileType(extension)

  // Log validation details for debugging
  console.log('File validation:', {
    fileName: file.name,
    fileType: file.type,
    detectedExtension: extension,
    supportFileType: fileType,
    allowedTypes,
    allowedExtensions,
  })

  const isTypeAllowed = allowedTypes.length === 0 || allowedTypes.includes(fileType) || allowedTypes.includes('custom')
  const isExtensionAllowed = allowedExtensions.length === 0
    || allowedExtensions.includes(extension)
    || allowedExtensions.includes(`.${extension}`)
    || allowedExtensions.includes(extension.toLowerCase())

  if (!isTypeAllowed)
    console.warn(`File type '${fileType}' not in allowed types:`, allowedTypes)

  if (!isExtensionAllowed)
    console.warn(`File extension '${extension}' not in allowed extensions:`, allowedExtensions)

  return isTypeAllowed && isExtensionAllowed
}

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

// Export types for external use
export type { FileUploadParams, FileUploadOptions }
export { FILE_EXTS }
