import type { TransferMethod } from '@/types/app'

// Re-export from centralized location
export { FileAppearanceTypeEnum } from '@/app/components/base/icons/file-type-icon'
export type { FileAppearanceType } from '@/app/components/base/icons/file-type-icon'

export type FileEntity = {
  id: string
  name: string
  size: number
  type: string
  progress: number
  transferMethod: TransferMethod
  supportFileType: string
  originalFile?: File
  uploadedId?: string
  base64Url?: string
  url?: string
  isRemote?: boolean
}
