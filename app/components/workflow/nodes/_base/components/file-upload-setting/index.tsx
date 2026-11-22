import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import produce from 'immer'
import type { UploadFileSetting } from '@/types/workflow'
import { SupportUploadFileTypes, TransferMethod } from '@/types/workflow'
import { FILE_EXTS } from '@/app/components/base/prompt-editor/constants'
import OptionCard from '@/app/components/workflow/nodes/_base/components/option-card'
import Switch from '@/app/components/base/switch'

type FileUploadSettingProps = {
  payload: UploadFileSetting
  onChange: (payload: UploadFileSetting) => void
  isMultiple?: boolean
  inFeaturePanel?: boolean
  hideSupportFileType?: boolean
}

const FileUploadSetting: React.FC<FileUploadSettingProps> = ({
  payload,
  onChange,
  isMultiple = false,
  inFeaturePanel = false,
  hideSupportFileType = false,
}) => {
  const { t } = useTranslation()

  const handleUploadMethodChange = useCallback((method: TransferMethod) => {
    const newPayload = produce(payload, (draft) => {
      if (method === TransferMethod.all)
        draft.allowed_file_upload_methods = [TransferMethod.local_file, TransferMethod.remote_url]
      else
        draft.allowed_file_upload_methods = [method]
    })
    onChange(newPayload)
  }, [payload, onChange])

  const handleFileTypeChange = useCallback((fileType: SupportUploadFileTypes, enabled: boolean) => {
    const newPayload = produce(payload, (draft) => {
      if (enabled) {
        if (!draft.allowed_file_types.includes(fileType)) {
          draft.allowed_file_types.push(fileType)
          const extensions = FILE_EXTS[fileType] || []
          draft.allowed_file_extensions = [...new Set([...draft.allowed_file_extensions, ...extensions])]
        }
      }
      else {
        draft.allowed_file_types = draft.allowed_file_types.filter(t => t !== fileType)
        const extensionsToRemove = FILE_EXTS[fileType] || []
        draft.allowed_file_extensions = draft.allowed_file_extensions.filter(
          ext => !extensionsToRemove.includes(ext),
        )
      }
    })
    onChange(newPayload)
  }, [payload, onChange])

  const handleMaxLengthChange = useCallback((maxLength: number) => {
    const newPayload = produce(payload, (draft) => {
      draft.max_length = maxLength
    })
    onChange(newPayload)
  }, [payload, onChange])

  return (
    <div className="space-y-4">
      {/* Upload Methods */}
      <div>
        <label className="system-sm-semibold text-text-secondary mb-2 block">
          {t('common.fileUploader.uploadMethods')}
        </label>
        <div className='grid grid-cols-3 gap-2'>
          <OptionCard
            title={t('common.fileUploader.uploadFromComputer')}
            selected={payload.allowed_file_upload_methods.length === 1 && payload.allowed_file_upload_methods.includes(TransferMethod.local_file)}
            onSelect={() => handleUploadMethodChange(TransferMethod.local_file)}
          />
          <OptionCard
            title="URL"
            selected={payload.allowed_file_upload_methods.length === 1 && payload.allowed_file_upload_methods.includes(TransferMethod.remote_url)}
            onSelect={() => handleUploadMethodChange(TransferMethod.remote_url)}
          />
          <OptionCard
            title={t('common.fileUploader.both')}
            selected={payload.allowed_file_upload_methods.includes(TransferMethod.local_file) && payload.allowed_file_upload_methods.includes(TransferMethod.remote_url)}
            onSelect={() => handleUploadMethodChange(TransferMethod.all)}
          />
        </div>
      </div>

      {/* File Types */}
      {!hideSupportFileType && (
        <div>
          <label className="system-sm-semibold text-text-secondary mb-2 block">
            {t('common.fileUploader.supportedFileTypes')}
          </label>
          <div className="space-y-2">
            {Object.values(SupportUploadFileTypes).map(fileType => (
              <div key={fileType} className="flex items-center justify-between">
                <span className="system-sm-regular text-text-primary capitalize">
                  {fileType}
                </span>
                <Switch
                  defaultValue={payload.allowed_file_types.includes(fileType)}
                  onChange={enabled => handleFileTypeChange(fileType, enabled)}
                  size="l"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Max Files */}
      {isMultiple && (
        <div>
          <label className="system-sm-semibold text-text-secondary mb-2 block">
            {t('common.fileUploader.maxFiles')}
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={payload.max_length}
            onChange={e => handleMaxLengthChange(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border border-components-input-border-active bg-components-input-bg-active px-3 py-2 text-sm outline-none focus:border-components-input-border-active focus:ring-1 focus:ring-components-input-border-active"
          />
        </div>
      )}
    </div>
  )
}

export default FileUploadSetting
