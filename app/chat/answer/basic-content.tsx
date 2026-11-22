import type { FC } from 'react'
import { memo } from 'react'
import type { ChatItem } from '../../types'
import { Markdown } from '@/app/components/base/markdown'
import cn from '@/utils/classnames'

type BasicContentProps = {
  item: ChatItem
  onButtonClick?: (message: string) => void
  selectedButtons?: string[]
  onButtonToggle?: (message: string) => void
  onMultipleSubmit?: (messages: string[]) => void
}
const BasicContent: FC<BasicContentProps> = ({
  item,
  onButtonClick,
  selectedButtons,
  onButtonToggle,
  onMultipleSubmit,
}) => {
  const {
    annotation,
    content,
  } = item

  if (annotation?.logAnnotation) {
    return (
      <Markdown
        content={annotation?.logAnnotation.content || ''}
        onButtonClick={onButtonClick}
        selectedButtons={selectedButtons}
        onButtonToggle={onButtonToggle}
        onMultipleSubmit={onMultipleSubmit}
      />
    )
  }

  return (
    <Markdown
      className={cn(
        item.isError && '!text-[#F04438]',
      )}
      content={content}
      onButtonClick={onButtonClick}
      selectedButtons={selectedButtons}
      onButtonToggle={onButtonToggle}
      onMultipleSubmit={onMultipleSubmit}
    />
  )
}

export default memo(BasicContent)
