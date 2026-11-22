import type { FC } from 'react'
import {
  memo,
  useRef,
} from 'react'
import { useHover } from 'ahooks'
import type { ConversationItem } from '@/models/share'
import Operation from '@/app/components/sidebar/operation'
import cn from '@/utils/classnames'
import { removeEmojis } from '@/utils'
import { REMOVE_EMOJIS_FROM_TITLES } from '@/config'

type ItemProps = {
  isPin?: boolean
  item: ConversationItem
  onOperate: (type: string, item: ConversationItem) => void
  onChangeConversation: (conversationId: string) => void
  currentConversationId: string
}
const Item: FC<ItemProps> = ({
  isPin,
  item,
  onOperate,
  onChangeConversation,
  currentConversationId,
}) => {
  const ref = useRef(null)
  const isHovering = useHover(ref)
  const isSelected = currentConversationId === item.id

  const displayName = REMOVE_EMOJIS_FROM_TITLES ? removeEmojis(item.name) : item.name

  return (
    <div
      ref={ref}
      className={cn(
        'system-sm-medium group flex items-center cursor-pointer rounded-lg p-1 px-1.5 text-components-menu-item-text hover:bg-state-base-hover',
        isSelected && 'bg-state-accent-active text-text-accent hover:bg-state-accent-active',
      )}
      onClick={() => {
        if (item.id && item.id.trim() !== '')
          onChangeConversation(item.id)
      }}
    >
      <div className='grow truncate p-1.5' title={displayName}>{displayName}</div>
      {item.id && item.id.trim() !== '' && (
        <div className='shrink-0' onClick={e => e.stopPropagation()}>
          <Operation
            isActive={isSelected}
            isPinned={!!isPin}
            isItemHovering={isHovering}
            togglePin={() => onOperate(isPin ? 'unpin' : 'pin', item)}
            isShowDelete
            isShowRenameConversation
            onRenameConversation={() => onOperate('rename', item)}
            onDelete={() => onOperate('delete', item)}
          />
        </div>
      )}
    </div>
  )
}

export default memo(Item)
