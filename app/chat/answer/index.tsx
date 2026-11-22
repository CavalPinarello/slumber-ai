import type {
  FC,
  ReactNode,
} from 'react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ChatConfig,
  ChatItem,
} from '../../types'
import ContentSwitch from '../content-switch'
import Operation from './operation'
import AgentContent from './agent-content'
import BasicContent from './basic-content'
import SuggestedQuestions from './suggested-questions'
import More from './more'
import WorkflowProcessItem from './workflow-process'
import { useChatContext } from '@/app/chat/context'
import LoadingAnim from '@/app/components/chat/loading-anim'
import Citation from '@/app/chat/citation'
// import { EditTitle } from '@/app/components/app/annotation/edit-annotation-modal/edit-item'
import type { AppData } from '@/models/share'
import cn from '@/utils/classnames'
import { FileList } from '@/app/components/base/file-uploader'

type AnswerProps = {
  item: ChatItem
  question: string
  index: number
  config?: ChatConfig
  answerIcon?: ReactNode
  responding?: boolean
  showPromptLog?: boolean
  chatAnswerContainerInner?: string
  hideProcessDetail?: boolean
  appData?: AppData
  noChatInput?: boolean
  switchSibling?: (siblingMessageId: string) => void
}
const Answer: FC<AnswerProps> = ({
  item,
  question,
  index,
  config,
  answerIcon,
  responding,
  showPromptLog,
  chatAnswerContainerInner,
  hideProcessDetail,
  appData,
  noChatInput,
  switchSibling,
}) => {
  const { t } = useTranslation()
  const {
    content,
    citation,
    agent_thoughts,
    more,
    annotation,
    workflowProcess,
    allFiles,
    message_files,
  } = item
  const hasAgentThoughts = !!agent_thoughts?.length

  const [containerWidth, setContainerWidth] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Button state and callbacks for interactive markdown buttons
  const [selectedButtons, setSelectedButtons] = useState<string[]>([])

  // Use useChatContext to get the onSend function for button clicks
  const { onSend } = useChatContext()

  const handleButtonClick = useCallback((message: string) => {
    console.log('Legacy Answer handleButtonClick:', message)
    onSend?.(message)
  }, [onSend])

  const handleButtonToggle = useCallback((message: string) => {
    console.log('Legacy Answer handleButtonToggle:', message)
    setSelectedButtons((prev) => {
      const newSelection = prev.includes(message)
        ? prev.filter(m => m !== message)
        : [...prev, message]
      console.log('Legacy Answer selected buttons updated:', newSelection)
      return newSelection
    })
  }, [])

  const handleMultipleSubmit = useCallback((messages: string[]) => {
    console.log('Legacy Answer handleMultipleSubmit:', messages)
    const combinedMessage = messages.join('、')
    onSend?.(combinedMessage)
    setSelectedButtons([]) // Reset after sending
  }, [onSend])

  const getContainerWidth = () => {
    if (containerRef.current)
      setContainerWidth(containerRef.current?.clientWidth + 16)
  }
  useEffect(() => {
    getContainerWidth()
  }, [])

  const getContentWidth = () => {
    if (contentRef.current)
      setContentWidth(contentRef.current?.clientWidth)
  }

  useEffect(() => {
    if (!responding)
      getContentWidth()
  }, [responding])

  // Recalculate contentWidth when content changes (e.g., SVG preview/source toggle)
  useEffect(() => {
    if (!containerRef.current)
      return
    const resizeObserver = new ResizeObserver(() => {
      getContentWidth()
    })
    resizeObserver.observe(containerRef.current)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const handleSwitchSibling = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev')
      item.prevSibling && switchSibling?.(item.prevSibling)
    else
      item.nextSibling && switchSibling?.(item.nextSibling)
  }, [switchSibling, item.prevSibling, item.nextSibling])

  return (
    <div className='mb-2 flex last:mb-0'>
      <div className='chat-answer-container group w-0 grow pb-4' ref={containerRef}>
        <div className={cn('group relative pr-0 sm:pr-14', chatAnswerContainerInner)}>
          <div
            ref={contentRef}
            className={cn('body-lg-regular relative inline-block max-w-full rounded-2xl bg-components-panel-bg px-5 py-4 text-text-primary', workflowProcess && 'w-full')}
          >
            {
              !responding && (
                <Operation
                  hasWorkflowProcess={!!workflowProcess}
                  maxSize={containerWidth - contentWidth - 4}
                  contentWidth={contentWidth}
                  item={item}
                  question={question}
                  index={index}
                  showPromptLog={showPromptLog}
                  noChatInput={noChatInput}
                />
              )
            }
            {/** Render the normal steps */}
            {
              workflowProcess && !hideProcessDetail && (
                <WorkflowProcessItem
                  data={workflowProcess}
                  item={item}
                  hideProcessDetail={hideProcessDetail}
                />
              )
            }
            {
              responding && !content && !hasAgentThoughts && (
                <div className='flex h-5 w-6 items-center justify-center'>
                  <LoadingAnim type='text' />
                </div>
              )
            }
            {
              content && !hasAgentThoughts && (
                <BasicContent
                  item={item}
                  onButtonClick={handleButtonClick}
                  selectedButtons={selectedButtons}
                  onButtonToggle={handleButtonToggle}
                  onMultipleSubmit={handleMultipleSubmit}
                />
              )
            }
            {
              (hasAgentThoughts) && (
                <AgentContent
                  item={item}
                  responding={responding}
                  content={content}
                  onButtonClick={handleButtonClick}
                  selectedButtons={selectedButtons}
                  onButtonToggle={handleButtonToggle}
                  onMultipleSubmit={handleMultipleSubmit}
                />
              )
            }
            {
              !!allFiles?.length && (
                <FileList
                  className='my-1'
                  files={allFiles}
                  showDeleteAction={false}
                  showDownloadAction
                  canPreview
                />
              )
            }
            {
              !!message_files?.length && (
                <FileList
                  className='my-1'
                  files={message_files}
                  showDeleteAction={false}
                  showDownloadAction
                  canPreview
                />
              )
            }
            {/*
              annotation?.id && annotation.authorName && (
                <EditTitle
                  className='mt-1'
                  title={t('appAnnotation.editBy', { author: annotation.authorName })}
                />
              )
            */}
            <SuggestedQuestions item={item} />
            {
              !!citation?.length && !responding && (
                <Citation data={citation} showHitInfo={config?.supportCitationHitInfo} />
              )
            }
            {
              item.siblingCount && item.siblingCount > 1 && item.siblingIndex !== undefined && (
                <ContentSwitch
                  count={item.siblingCount}
                  currentIndex={item.siblingIndex}
                  prevDisabled={!item.prevSibling}
                  nextDisabled={!item.nextSibling}
                  switchSibling={handleSwitchSibling}
                />
              )
            }
          </div>
        </div>
        <More more={more} />
      </div>
    </div>
  )
}

export default memo(Answer)
