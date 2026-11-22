'use client'
import type { FC } from 'react'
import React, { useCallback, useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'

export type IChatProps = {
  chatList: ChatItem[]
  /**
   * Whether to display the editing area and rating status
   */
  feedbackDisabled?: boolean
  /**
   * Whether to display the input area
   */
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  useCurrentUserAvatar?: boolean
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  useCurrentUserAvatar,
  isResponding,
  controlClearQuery,
  visionConfig,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')

  // Enhanced refs for better layout management
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatFooterRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef(false)

  // Enhanced scroll handling inspired by /web reference
  const handleScrollToBottom = useCallback(() => {
    if (chatList.length > 1 && chatContainerRef.current && !userScrolledRef.current)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
  }, [chatList.length])

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])

  // Enhanced scroll and layout management
  useEffect(() => {
    handleScrollToBottom()
  }, [handleScrollToBottom])

  useEffect(() => {
    if (chatContainerRef.current) {
      requestAnimationFrame(() => {
        handleScrollToBottom()
      })
    }
  })

  // User scroll detection
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (chatContainer) {
      const setUserScrolled = () => {
        if (chatContainer)
          userScrolledRef.current = chatContainer.scrollHeight - chatContainer.scrollTop > chatContainer.clientHeight + 10
      }
      chatContainer.addEventListener('scroll', setUserScrolled)
      return () => chatContainer.removeEventListener('scroll', setUserScrolled)
    }
  }, [])

  // Footer positioning with ResizeObserver
  useEffect(() => {
    if (chatFooterRef.current && chatContainerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { blockSize } = entry.borderBoxSize[0]
          if (chatContainerRef.current) {
            chatContainerRef.current.style.paddingBottom = `${blockSize}px`
            handleScrollToBottom()
          }
        }
      })
      resizeObserver.observe(chatFooterRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [handleScrollToBottom])

  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend()))
      return
    onSend(queryRef.current, files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    })))
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length)
        onClear()
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current)
        handleSend()
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  return (
    <div className="relative h-full">
      {/* Chat Container */}
      <div
        ref={chatContainerRef}
        className={cn(
          'relative h-full overflow-y-auto overflow-x-hidden',
          !feedbackDisabled && 'px-3.5',
        )}
      >
        {/* Chat Content */}
        <div className={cn(
          'w-full space-y-6',
          !feedbackDisabled && 'pb-4',
        )}>
          {chatList.map((item, index) => {
            if (item.isAnswer) {
              const isLast = item.id === chatList[chatList.length - 1].id
              return (
                <Answer
                  key={item.id}
                  item={item}
                  feedbackDisabled={feedbackDisabled}
                  onFeedback={onFeedback}
                  isResponding={isResponding && isLast}
                  suggestionClick={suggestionClick}
                />
              )
            }
            return (
              <Question
                key={item.id}
                id={item.id}
                content={item.content}
                useCurrentUserAvatar={useCurrentUserAvatar}
                imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
              />
            )
          })}
        </div>
      </div>

      {/* Footer */}
      {!isHideSendInput && (
        <div
          ref={chatFooterRef}
          className={cn(
            'absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white to-transparent',
            !feedbackDisabled && 'left-3.5 right-3.5',
          )}
        >
          <div className={cn(
            'relative rounded-xl border border-gray-200 bg-white shadow-md',
            'max-h-[158px] overflow-y-auto p-2',
          )}>
            {/* File Upload Section */}
            {visionConfig?.enabled && (
              <div className='mb-2'>
                <div className='flex items-center gap-2'>
                  <ChatImageUploader
                    settings={visionConfig}
                    onUpload={onUpload}
                    disabled={files.length >= visionConfig.number_limits}
                  />
                </div>
                <ImageList
                  list={files}
                  onRemove={onRemove}
                  onReUpload={onReUpload}
                  onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                  onImageLinkLoadError={onImageLinkLoadError}
                />
              </div>
            )}

            {/* Input Area */}
            <div className='relative flex items-end gap-2'>
              <div className='flex-1 relative'>
                <Textarea
                  className={cn(
                    'w-full resize-none border-0 bg-transparent p-2 text-sm text-gray-700',
                    'outline-none placeholder:text-gray-400 leading-5',
                    'min-h-[40px] max-h-[120px]',
                  )}
                  placeholder={t('appDebug.feature.chatInput.placeholder') || 'Type your message...'}
                  value={query}
                  onChange={handleContentChange}
                  onKeyUp={handleKeyUp}
                  onKeyDown={handleKeyDown}
                  autoSize
                />
              </div>

              {/* Send Button and Counter */}
              <div className='flex items-center gap-2 pb-2'>
                <div className='text-xs text-gray-400'>
                  {query.trim().length}
                </div>
                <Tooltip
                  selector='send-tip'
                  htmlContent={
                    <div>
                      <div>{t('common.operation.send')} Enter</div>
                      <div>{t('common.operation.lineBreak')} Shift Enter</div>
                    </div>
                  }
                >
                  <button
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                      query.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400',
                    )}
                    onClick={handleSend}
                    disabled={!query.trim()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(Chat)
