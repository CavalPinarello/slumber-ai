import React from 'react'
import { useTranslation } from 'react-i18next'
import { RiChatAiLine } from '@remixicon/react'
import Button from '@/app/components/base/button'
import Divider from '@/app/components/base/divider'
import cn from '@/utils/classnames'

// Generic context interface for dependency injection
type InputsFormContext = {
  isMobile: boolean
  currentConversationId: string | null
  themeBuilder?: {
    theme?: {
      primaryColor?: string
    }
  }
  handleStartChat: (callback?: () => void) => void
  allInputsHidden: boolean
  inputsForms: any[]
}

type Props = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  context: InputsFormContext
  ContentComponent: React.ComponentType
  variant?: 'default' | 'embedded'
}

const BaseInputsForm = ({
  collapsed,
  setCollapsed,
  context,
  ContentComponent,
  variant = 'default',
}: Props) => {
  const { t } = useTranslation()
  const {
    isMobile,
    currentConversationId,
    themeBuilder,
    handleStartChat,
    allInputsHidden,
    inputsForms,
  } = context

  if (allInputsHidden || inputsForms.length === 0)
    return null

  const isEmbedded = variant === 'embedded'

  return (
    <div className={cn(
      'flex flex-col items-center px-4 pt-4 mt-0 sm:mt-14',
      isMobile && 'pt-2',
      isEmbedded && 'mb-6',
      isEmbedded && isMobile && 'mb-4',
    )}>
      <div className={cn(
        'w-full max-w-[582px] rounded-2xl bg-components-panel-bg',
        collapsed && 'border border-components-panel-border bg-noneshadow-none',
        isMobile && !collapsed && 'border border-components-panel-border',
      )}>
        <div className={cn(
          'flex items-center gap-3 rounded-t-2xl px-6 py-4',
          !collapsed && 'border-b border-divider-subtle',
          isMobile && 'px-4 py-3',
          collapsed && !currentConversationId && 'cursor-pointer hover:bg-background-default-hover transition-colors',
        )}
        onClick={collapsed && !currentConversationId ? () => setCollapsed(false) : undefined}>
          <RiChatAiLine className='h-4 w-4 shrink-0 text-text-tertiary' />
          <div className='text-sm system-xl-semibold grow text-text-tertiary'>
            {collapsed && !currentConversationId ? '📝 Click here to fill out the intake form' : t('share.chat.chatSettingsTitle')}
          </div>
          {collapsed && currentConversationId && (
            <Button className='uppercase text-text-tertiary opacity-80' size='small' variant='ghost' onClick={() => setCollapsed(false)}>{t('common.operation.edit')}</Button>
          )}
          {!collapsed && currentConversationId && (
            <Button className='uppercase text-text-tertiary opacity-80' size='small' variant='ghost' onClick={() => setCollapsed(true)}>{t('common.operation.close')}</Button>
          )}
        </div>
        {!collapsed && (
          <div className={cn('p-6', isMobile && 'p-4')}>
            <ContentComponent />
          </div>
        )}
        {!collapsed && !currentConversationId && (
          <div className={cn('p-6', isMobile && 'p-4')}>
            <Button
              variant='primary'
              className='w-full'
              onClick={() => handleStartChat(() => setCollapsed(true))}

            >{t('share.chat.startChat')}</Button>
          </div>
        )}
      </div>
      {collapsed && (
        <div className='flex w-full max-w-[720px] items-center py-4'>
          <Divider bgStyle='gradient' className='h-px basis-1/2 rotate-180' />
          <Divider bgStyle='gradient' className='h-px basis-1/2' />
        </div>
      )}
    </div>
  )
}

export default BaseInputsForm
export type { InputsFormContext }
