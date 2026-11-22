import type { FC } from 'react'
import React from 'react'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import {
  RiChatAiLine,
  RiContractLeftLine,
  RiExpandRightLine,
} from '@remixicon/react'
import ActionButton from '@/app/components/base/action-button'
import Operation from '@/app/components/header/operation'
import SlumberLogo from '@/app/components/base/slumber-logo'

export type IHeaderProps = {
  title: string
  icon?: string
  iconType?: 'emoji' | 'image'
  iconUrl?: string
  iconBackground?: string
  isMobile?: boolean
  isSidebarCollapsed?: boolean
  onShowSideBar?: () => void
  onToggleSidebar?: () => void
  onCreateNewChat?: () => void
  onViewChatSettings?: () => void
  showChatSettings?: boolean
  currentConversationId?: string
  currentConversationName?: string
  isPinned?: boolean
  onTogglePin?: () => void
  onRenameConversation?: () => void
  onDeleteConversation?: () => void
}

const Header: FC<IHeaderProps> = ({
  title,
  icon,
  iconType,
  iconUrl,
  iconBackground,
  isMobile,
  isSidebarCollapsed,
  onShowSideBar,
  onToggleSidebar,
  onCreateNewChat,
  onViewChatSettings,
  showChatSettings,
  currentConversationId,
  currentConversationName,
  isPinned,
  onTogglePin,
  onRenameConversation,
  onDeleteConversation,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 flex items-center h-14 px-3 bg-transparent backdrop-blur-lg z-10">
      <div className='flex items-center justify-start w-8'>
        {isMobile && isSidebarCollapsed && (
          <div
            className='flex items-center justify-center h-8 w-8 cursor-pointer'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4 text-gray-500" />
          </div>
        )}
        <div className='shrink-0'>
          {!isMobile && isSidebarCollapsed && (
            <ActionButton size='l' onClick={() => onToggleSidebar?.()}>
              <RiExpandRightLine className='h-[18px] w-[18px]' />
            </ActionButton>
          )}
          {!isMobile && !isSidebarCollapsed && (
            <ActionButton size='l' onClick={() => onToggleSidebar?.()}>
              <RiContractLeftLine className='h-[18px] w-[18px]' />
            </ActionButton>
          )}
        </div>
      </div>
      <div className='flex items-center justify-center flex-1'>
        {!currentConversationId && (
          <div className='flex items-center gap-3'>
            <SlumberLogo className='w-30 h-6' />
          </div>
        )}
        {currentConversationId && (
          <Operation
            title={currentConversationName || ''}
            isPinned={!!isPinned}
            togglePin={() => onTogglePin?.()}
            isShowDelete
            isShowRenameConversation
            onRenameConversation={() => onRenameConversation?.()}
            onDelete={() => onDeleteConversation?.()}
          />
        )}
      </div>
      <div className='flex items-center justify-end w-8'>
        {!isMobile && !showChatSettings && (
          <ActionButton size='l' onClick={() => onViewChatSettings?.()}>
            <RiChatAiLine className='h-[18px] w-[18px]' />
          </ActionButton>
        )}
        {isMobile && (
          <div className='flex items-center justify-center h-8 w-8 cursor-pointer'
            onClick={() => onCreateNewChat?.()}
          >
            <PencilSquareIcon className="h-4 w-4 text-gray-500" />
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(Header)
