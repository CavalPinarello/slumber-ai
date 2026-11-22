import type {
  FC,
  ReactNode,
} from 'react'
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { RiClipboardLine, RiEditLine } from '@remixicon/react'
import copy from 'copy-to-clipboard'
import { useTranslation } from 'react-i18next'
import Textarea from 'react-textarea-autosize'
import type { ChatItem } from '../types'
import type { Theme } from '../embedded-chatbot/theme/theme-context'
import { CssTransform } from '../embedded-chatbot/theme/utils'
import ContentSwitch from './content-switch'
import { useChatContext } from './context'
import Toast from '@/app/components/base/toast'
import Button from '@/app/components/base/button'
import { Markdown } from '@/app/components/base/markdown'
import { FileList } from '@/app/components/base/file-uploader'
import ActionButton from '@/app/components/base/action-button'
import cn from '@/utils/classnames'

type QuestionProps = {
  item: ChatItem
  questionIcon?: ReactNode
  theme: Theme | null | undefined
  enableEdit?: boolean
  switchSibling?: (siblingMessageId: string) => void
}

const Question: FC<QuestionProps> = ({
  item,
  questionIcon,
  theme,
  enableEdit = true,
  switchSibling,
}) => {
  const { t } = useTranslation()

  const {
    content,
    message_files,
  } = item

  const {
    onRegenerate,
  } = useChatContext()

  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [contentWidth, setContentWidth] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleEdit = useCallback(() => {
    setIsEditing(true)
    setEditedContent(content)
  }, [content])

  const handleResend = useCallback(() => {
    setIsEditing(false)
    onRegenerate?.(item, { message: editedContent, files: message_files })
  }, [editedContent, message_files, item, onRegenerate])

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false)
    setEditedContent(content)
  }, [content])

  const handleSwitchSibling = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev')
      item.prevSibling && switchSibling?.(item.prevSibling)
    else
      item.nextSibling && switchSibling?.(item.nextSibling)
  }, [switchSibling, item.prevSibling, item.nextSibling])

  const getContentWidth = () => {
    if (contentRef.current)
      setContentWidth(contentRef.current?.clientWidth)
  }

  useEffect(() => {
    if (!contentRef.current)
      return
    const resizeObserver = new ResizeObserver(() => {
      getContentWidth()
    })
    resizeObserver.observe(contentRef.current)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div className='mb-7 flex justify-end last:mb-0'>
      <div className={cn('group relative flex max-w-full items-start pl-14', isEditing && 'flex-1')}>
        <div className={cn('mr-2 gap-1', isEditing ? 'hidden' : 'flex')}>
          <div
            className="absolute hidden gap-0.5 rounded-[10px] border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 shadow-2xl backdrop-blur-sm group-hover:flex"
            style={{ right: contentWidth + 8 }}
          >
            <ActionButton onClick={() => {
              copy(content)
              Toast.notify({ type: 'success', message: t('common.actionMsg.copySuccessfully') })
            }}>
              <RiClipboardLine className='h-4 w-4' />
            </ActionButton>
            {enableEdit && <ActionButton onClick={handleEdit}>
              <RiEditLine className='h-4 w-4' />
            </ActionButton>}
          </div>
        </div>
        <div
          ref={contentRef}
          className='w-full rounded-2xl bg-chat-bubble-bg px-5 py-3 text-sm custom-markdown-color'
          style={{
            ...(theme?.chatBubbleColorStyle ? CssTransform(theme.chatBubbleColorStyle) : {}),
          }}
        >
          {
            !!message_files?.length && (
              <FileList
                className='mb-2'
                files={message_files}
                showDeleteAction={false}
                showDownloadAction={true}
              />
            )
          }
          {!isEditing
            ? <Markdown content={content} />
            : <div className="
                -mx-2 flex flex-col gap-2 rounded-lg
                border border-components-chat-input-border bg-components-panel-bg p-[9px]
              ">
              <div className="max-h-[158px] overflow-y-auto overflow-x-hidden">
                <Textarea
                  className={cn(
                    'body-lg-regular w-full p-1 leading-6 text-text-secondary outline-none bg-transparent',
                  )}
                  autoFocus
                  minRows={1}
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant='ghost' onClick={handleCancelEditing}>{t('common.operation.cancel')}</Button>
                <Button variant='primary' onClick={handleResend}>{t('common.chat.resend')}</Button>
              </div>
            </div>}
          {!isEditing && <ContentSwitch
            count={item.siblingCount}
            currentIndex={item.siblingIndex}
            prevDisabled={!item.prevSibling}
            nextDisabled={!item.nextSibling}
            switchSibling={handleSwitchSibling}
          />}
        </div>
      </div>
    </div>
  )
}

export default memo(Question)
