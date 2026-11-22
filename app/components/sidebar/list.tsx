import type { FC } from 'react'
import Item from './item'
import type { ConversationItem } from '@/models/share'

type ListProps = {
  isPin?: boolean
  title?: string
  list: ConversationItem[]
  onOperate: (type: string, item: ConversationItem) => void
  onChangeConversation: (conversationId: string) => void
  currentConversationId: string
}
const List: FC<ListProps> = ({
  isPin,
  title,
  list,
  onOperate,
  onChangeConversation,
  currentConversationId,
}) => {
  return (
    <div className='space-y-0.5'>
      {title && (
        <div className='system-xs-medium-uppercase px-3 pb-2 pt-2 text-text-tertiary opacity-60'>{title}</div>
      )}
      {list.map((item, index) => (
        <Item
          key={item.id ? `${isPin ? 'pinned' : 'unpinned'}-${item.id}` : `conversation-${isPin ? 'pinned' : 'unpinned'}-${index}`}
          isPin={isPin}
          item={item}
          onOperate={onOperate}
          onChangeConversation={onChangeConversation}
          currentConversationId={currentConversationId}
        />
      ))}
    </div>
  )
}

export default List
