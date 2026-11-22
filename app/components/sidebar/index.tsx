import {
  useCallback,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  RiChatNewLine,
  RiCloseLine,
  RiExpandRightLine,
} from '@remixicon/react'
import { useChatWithHistoryContext } from '../context'
import ActionButton from '@/app/components/base/action-button'
import Button from '@/app/components/base/button'
import Logo from '@/app/components/base/logo/logo'
import SlumberLogo from '@/app/components/base/slumber-logo'
import List from '@/app/components/sidebar/list'
import MenuDropdown from '@/app/components/share/text-generation/menu-dropdown'
import Confirm from '@/app/components/base/confirm'
import RenameModal from '@/app/components/sidebar/rename-modal'
import type { ConversationItem } from '@/models/share'
import cn from '@/utils/classnames'
import { useGlobalPublicStore } from '@/context/global-public-context'

type Props = {
  isPanel?: boolean
  onClose?: () => void
}

const Sidebar = ({ isPanel, onClose }: Props) => {
  const { t } = useTranslation()
  const {
    isInstalledApp,
    appData,
    handleNewConversation,
    pinnedConversationList,
    conversationList,
    currentConversationId,
    handleChangeConversation,
    handlePinConversation,
    handleUnpinConversation,
    conversationRenaming,
    handleRenameConversation,
    handleDeleteConversation,
    sidebarCollapseState,
    handleSidebarCollapse,
    isMobile,
    isResponding,
  } = useChatWithHistoryContext()
  const isSidebarCollapsed = sidebarCollapseState
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)
  const [showConfirm, setShowConfirm] = useState<ConversationItem | null>(null)
  const [showRename, setShowRename] = useState<ConversationItem | null>(null)

  const handleOperate = useCallback((type: string, item: ConversationItem) => {
    if (type === 'pin')
      handlePinConversation(item.id)

    if (type === 'unpin') {
      if (!item.id || item.id.trim() === '') {
        console.error('Cannot unpin conversation: invalid ID', item)
        return
      }
      handleUnpinConversation(item.id)
    }

    if (type === 'delete')
      setShowConfirm(item)

    if (type === 'rename')
      setShowRename(item)
  }, [handlePinConversation, handleUnpinConversation])
  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(null)
  }, [])
  const handleDelete = useCallback(() => {
    if (showConfirm)
      handleDeleteConversation(showConfirm.id, { onSuccess: handleCancelConfirm })
  }, [showConfirm, handleDeleteConversation, handleCancelConfirm])
  const handleCancelRename = useCallback(() => {
    setShowRename(null)
  }, [])
  const handleRename = useCallback((newName: string) => {
    if (showRename)
      handleRenameConversation(showRename.id, newName, { onSuccess: handleCancelRename })
  }, [showRename, handleRenameConversation, handleCancelRename])

  const handleChangeConversationWithClose = useCallback((conversationId: string) => {
    handleChangeConversation(conversationId)
    if (isMobile && onClose)
      onClose()
  }, [handleChangeConversation, isMobile, onClose])

  return (
    <div className={cn(
      'flex w-full grow flex-col',
      isPanel && 'rounded-xl border-[0.5px] border-components-panel-border-subtle bg-components-panel-bg shadow-2xl',
    )}>
      <div className={cn(
        'flex shrink-0 flex-col gap-1 p-3',
      )}>
        <div className='flex justify-between'>
          <div className='shrink-0 py-2'>
            <SlumberLogo
              className='w-58 h-9'
            />
          </div>
          <div className='shrink-0'>
            {isMobile && onClose && (
              <ActionButton size='l' onClick={onClose}>
                <RiCloseLine className='h-[18px] w-[18px]' />
              </ActionButton>
            )}
            {!isMobile && isSidebarCollapsed && (
              <ActionButton size='l' onClick={() => handleSidebarCollapse(false)}>
                <RiExpandRightLine className='h-[18px] w-[18px]' />
              </ActionButton>
            )}
          </div>
        </div>
      </div>
      <div className='shrink-0 px-3 py-4'>
        <Button variant='secondary-accent' disabled={isResponding} className='w-full justify-center' onClick={() => {
          handleNewConversation()
          if (isMobile && onClose)
            onClose()
        }}>
          <RiChatNewLine className='mr-2 h-4 w-4' />
          {t('share.chat.newChat')}
        </Button>
      </div>
      <div className='h-0 grow space-y-2 overflow-y-auto px-3 pt-4'>
        {/* pinned list */}
        {!!pinnedConversationList.length && (
          <div className='mb-4'>
            <List
              isPin
              title={t('share.chat.pinnedTitle') || ''}
              list={pinnedConversationList}
              onChangeConversation={handleChangeConversationWithClose}
              onOperate={handleOperate}
              currentConversationId={currentConversationId}
            />
          </div>
        )}
        {!!conversationList.length && (
          <List
            title={(pinnedConversationList.length && t('share.chat.unpinnedTitle')) || ''}
            list={conversationList}
            onChangeConversation={handleChangeConversationWithClose}
            onOperate={handleOperate}
            currentConversationId={currentConversationId}
          />
        )}
      </div>
      <div className='flex shrink-0 items-center justify-between p-3 pr-5'>
        <MenuDropdown hideLogout={isInstalledApp} placement='top-start' data={appData?.site} />
        {/* powered by */}
        <div className='shrink-0'>
          {!appData?.custom_config?.remove_webapp_brand && (
            <div className={cn(
              'flex shrink-0 items-center gap-1.5',
            )}>
              {
                systemFeatures.branding.enabled && systemFeatures.branding.workspace_logo
                  ? <img src={systemFeatures.branding.workspace_logo} alt='logo' className='block h-5 w-auto' />
                  : appData?.custom_config?.replace_webapp_logo
                    ? <img src={`${appData?.custom_config?.replace_webapp_logo}`} alt='logo' className='block h-5 w-auto' />
                    : <Logo size='large' />
              }
            </div>
          )}
        </div>
        {!!showConfirm && (
          <Confirm
            title={t('share.chat.deleteConversation.title')}
            content={t('share.chat.deleteConversation.content') || ''}
            isShow
            onCancel={handleCancelConfirm}
            onConfirm={handleDelete}
          />
        )}
        {showRename && (
          <RenameModal
            isShow
            onClose={handleCancelRename}
            saveLoading={conversationRenaming}
            name={showRename?.name || ''}
            onSave={handleRename}
          />
        )}
      </div>
    </div>
  )
}

export default Sidebar
