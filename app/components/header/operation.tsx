'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import type { Placement } from '@floating-ui/react'
import {
  RiArrowDownSLine,
} from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { PortalToFollowElem, PortalToFollowElemContent, PortalToFollowElemTrigger } from '@/app/components/base/portal-to-follow-elem'
import cn from '@/utils/classnames'
import { removeEmojis } from '@/utils'
import { REMOVE_EMOJIS_FROM_TITLES } from '@/config'

type Props = {
  title: string
  isPinned: boolean
  isShowRenameConversation?: boolean
  onRenameConversation?: () => void
  isShowDelete: boolean
  togglePin: () => void
  onDelete: () => void
  placement?: Placement
}

const Operation: FC<Props> = ({
  title,
  isPinned,
  togglePin,
  isShowRenameConversation,
  onRenameConversation,
  isShowDelete,
  onDelete,
  placement = 'bottom-start',
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const displayTitle = REMOVE_EMOJIS_FROM_TITLES ? removeEmojis(title) : title

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      offset={4}
    >
      <PortalToFollowElemTrigger
        onClick={() => setOpen(v => !v)}
      >
        <div className={cn('flex cursor-pointer items-center rounded-lg p-1.5 pl-4 pr-3 text-text-secondary hover:bg-state-base-hover gap-1', open && 'bg-state-base-hover')}>
          <div className='system-md-semibold'>{displayTitle}</div>
          <RiArrowDownSLine className='h-4 w-4 ' />
        </div>
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className="z-50">
        <div
          className={'min-w-[120px] rounded-xl border-[0.5px] border-components-panel-border bg-components-panel-bg-blur p-1 shadow-lg backdrop-blur-sm'}
        >
          <div className={cn('system-md-regular flex cursor-pointer items-center space-x-1 rounded-lg px-3 py-1.5 text-text-secondary hover:bg-state-base-hover')} onClick={togglePin}>
            <span className='grow'>{isPinned ? t('explore.sidebar.action.unpin') : t('explore.sidebar.action.pin')}</span>
          </div>
          {isShowRenameConversation && (
            <div className={cn('system-md-regular flex cursor-pointer items-center space-x-1 rounded-lg px-3 py-1.5 text-text-secondary hover:bg-state-base-hover')} onClick={onRenameConversation}>
              <span className='grow'>{t('explore.sidebar.action.rename')}</span>
            </div>
          )}
          {isShowDelete && (
            <div className={cn('system-md-regular group flex cursor-pointer items-center space-x-1 rounded-lg px-3 py-1.5 text-text-secondary hover:bg-state-destructive-hover hover:text-text-destructive')} onClick={onDelete} >
              <span className='grow'>{t('explore.sidebar.action.delete')}</span>
            </div>
          )}
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  )
}
export default React.memo(Operation)
