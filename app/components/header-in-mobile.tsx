import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RiChatAiLine,
  RiCloseLine,
  RiMenuLine,
} from '@remixicon/react'
import { useChatWithHistoryContext } from './context'
import Operation from './header/operation'
import Sidebar from './sidebar'
import MobileOperationDropdown from './header/mobile-operation-dropdown'
import ActionButton from '@/app/components/base/action-button'
import InputsFormContent from '@/app/components/inputs-form/content'
import Confirm from '@/app/components/base/confirm'
import RenameModal from '@/app/components/sidebar/rename-modal'
import SlumberLogo from '@/app/components/base/slumber-logo'
import type { ConversationItem } from '@/models/share'

const HeaderInMobile = () => {
  const {
    appData,
    currentConversationId,
    currentConversationItem,
    pinnedConversationList,
    handleNewConversation,
    handlePinConversation,
    handleUnpinConversation,
    handleDeleteConversation,
    handleRenameConversation,
    conversationRenaming,
    inputsForms,
  } = useChatWithHistoryContext()
  const { t } = useTranslation()
  const isPin = pinnedConversationList.some(item => item.id === currentConversationId)
  const [showConfirm, setShowConfirm] = useState<ConversationItem | null>(null)
  const [showRename, setShowRename] = useState<ConversationItem | null>(null)
  const handleOperate = useCallback((type: string) => {
    if (type === 'pin')
      handlePinConversation(currentConversationId)

    if (type === 'unpin')
      handleUnpinConversation(currentConversationId)

    if (type === 'delete')
      setShowConfirm(currentConversationItem as any)

    if (type === 'rename')
      setShowRename(currentConversationItem as any)
  }, [currentConversationId, currentConversationItem, handlePinConversation, handleUnpinConversation])
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
  const [showSidebar, setShowSidebar] = useState(false)
  const [showChatSettings, setShowChatSettings] = useState(false)

  return (
    <>
      <div className='flex shrink-0 items-center gap-1 px-2 py-3'>
        <ActionButton size='l' className='shrink-0' onClick={() => setShowSidebar(true)}>
          <RiMenuLine className='h-[18px] w-[18px]' />
        </ActionButton>
        <div className='flex grow items-center justify-center'>
          {!currentConversationId && (
            <SlumberLogo className='w-30 h-5' />
          )}
          {currentConversationId && (
            <Operation
              title={currentConversationItem?.name || ''}
              isPinned={!!isPin}
              togglePin={() => handleOperate(isPin ? 'unpin' : 'pin')}
              isShowDelete
              isShowRenameConversation
              onRenameConversation={() => handleOperate('rename')}
              onDelete={() => handleOperate('delete')}
            />
          )}
        </div>
        <MobileOperationDropdown
          handleResetChat={handleNewConversation}
          handleViewChatSettings={() => setShowChatSettings(true)}
          hideViewChatSettings={inputsForms.length < 1}
        />
      </div>
      {showSidebar && (
        <div className='fixed inset-0 z-50 flex bg-background-overlay p-1'
          onClick={() => setShowSidebar(false)}
        >
          <div className='flex h-full w-full rounded-xl bg-components-panel-bg shadow-lg backdrop-blur-sm' onClick={e => e.stopPropagation()}>
            <Sidebar onClose={() => setShowSidebar(false)} />
          </div>
        </div>
      )}
      {showChatSettings && (
        <div className='fixed inset-0 z-50 flex justify-end bg-background-overlay p-1'
          onClick={() => setShowChatSettings(false)}
        >
          <div className='flex h-full w-full flex-col rounded-xl bg-components-panel-bg shadow-lg backdrop-blur-sm' onClick={e => e.stopPropagation()}>
            <div className='flex items-center gap-3 rounded-t-2xl border-b border-divider-subtle pl-4 pr-3 py-3'>
              <RiChatAiLine className='h-4 w-4 shrink-0 text-text-tertiary' />
              <div className='text-sm system-xl-semibold grow text-text-tertiary'>{t('share.chat.chatSettingsTitle')}</div>
              <ActionButton size='l' onClick={() => setShowChatSettings(false)}>
                <RiCloseLine className='h-5 w-5' />
              </ActionButton>
            </div>
            <div className='flex-1 overflow-y-auto p-4'>
              <InputsFormContent />
            </div>
          </div>
        </div>
      )}
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
    </>
  )
}

export default HeaderInMobile
