'use client'
import type { FC } from 'react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useAsyncEffect } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { RiChatAiLine } from '@remixicon/react'
import {
  ChatWithHistoryContext,
  useChatWithHistoryContext,
} from './context'
import { useChatWithHistory } from './hooks'
import Sidebar from './sidebar'
import Header from './header'
import HeaderInMobile from './header-in-mobile'
import ChatWrapper from './chat-wrapper'
import Confirm from '@/app/components/base/confirm'
import RenameModal from '@/app/components/sidebar/rename-modal'
import InputsFormContent from '@/app/components/inputs-form/content'
import { useThemeContext } from '@/app/components/embedded-chatbot/theme/theme-context'
import type { InstalledApp } from '@/models/explore'
import type { ConversationItem } from '@/models/share'
import Loading from '@/app/components/base/loading'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import { checkOrSetAccessToken, removeAccessToken } from '@/app/components/share/utils'
import AppUnavailable from '@/app/components/base/app-unavailable'
import cn from '@/utils/classnames'
import useDocumentTitle from '@/hooks/use-document-title'

type ChatWithHistoryProps = {
  className?: string
}

const ChatWithHistory: FC<ChatWithHistoryProps> = ({
  className,
}) => {
  const {
    userCanAccess,
    appInfoError,
    appData,
    appInfoLoading,
    appChatListDataLoading,
    chatShouldReloadKey,
    isMobile,
    themeBuilder,
    sidebarCollapseState,
    handleSidebarCollapse,
    isInstalledApp,
    currentConversationId,
    currentConversationItem,
    pinnedConversationList,
    handlePinConversation,
    handleUnpinConversation,
    handleDeleteConversation,
    handleRenameConversation,
    conversationRenaming,
    inputsForms,
  } = useChatWithHistoryContext()
  const isSidebarCollapsed = sidebarCollapseState
  const customConfig = appData?.custom_config
  const site = appData?.site
  const isPin = pinnedConversationList.some(item => item.id === currentConversationId)

  const [showSidePanel, setShowSidePanel] = useState(false)
  const [showConfirm, setShowConfirm] = useState<ConversationItem | null>(null)
  const [showRename, setShowRename] = useState<ConversationItem | null>(null)
  const [showChatSettings, setShowChatSettings] = useState(false)

  // チャット設定が表示される条件：新規チャット状態かつフォームが存在する
  const isShowingChatSettings = showChatSettings || (!currentConversationId && inputsForms.length > 0)

  const handleHeaderOperate = useCallback((type: string) => {
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

  useEffect(() => {
    themeBuilder?.buildTheme(site?.chat_color_theme, site?.chat_color_theme_inverted)
  }, [site, customConfig, themeBuilder])

  useDocumentTitle(site?.title || 'Chat')

  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const getSigninUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.delete('message')
    params.set('redirect_url', pathname)
    return `/webapp-signin?${params.toString()}`
  }, [searchParams, pathname])

  const backToHome = useCallback(() => {
    removeAccessToken()
    const url = getSigninUrl()
    router.replace(url)
  }, [getSigninUrl, router])

  if (appInfoLoading) {
    return (
      <Loading type='app' />
    )
  }
  if (!userCanAccess) {
    return <div className='flex h-full flex-col items-center justify-center gap-y-2'>
      <AppUnavailable className='h-auto w-auto' code={403} unknownReason='no permission.' />
      {!isInstalledApp && <span className='system-sm-regular cursor-pointer text-text-tertiary' onClick={backToHome}>{t('common.userProfile.logout')}</span>}
    </div>
  }

  if (appInfoError) {
    return (
      <AppUnavailable />
    )
  }

  return (
    <div className={cn(
      'flex h-full bg-background-default-burn',
      isMobile && 'flex-col',
      className,
    )}>
      {!isMobile && (
        <div className={cn(
          'flex w-[286px] flex-col p-1 -mr-2 transition-all duration-200 ease-in-out',
          isSidebarCollapsed && 'w-0 overflow-hidden !p-0 mr-0',
        )}>
          <Sidebar />
        </div>
      )}
      {isMobile && (
        <HeaderInMobile />
      )}
      <div className={cn('relative grow p-2', isMobile && 'h-[calc(100%_-_96px)] p-0')}>
        {isSidebarCollapsed && (
          <div
            className={cn(
              'absolute top-0 z-20 flex h-full w-[316px] flex-col p-3 transition-all duration-500 ease-in-out',
              showSidePanel ? 'left-0' : 'left-[-308px]',
            )}
            onMouseEnter={() => setShowSidePanel(true)}
            onMouseLeave={() => setShowSidePanel(false)}
          >
            <Sidebar isPanel />
          </div>
        )}
        <div className={cn('relative flex h-full flex-col overflow-hidden border-[0,5px] border-components-panel-border-subtle bg-chatbot-bg', isMobile ? 'rounded-t-2xl' : 'rounded-2xl')}>
          {!isMobile && (
            <Header
              title={site?.title || 'Chat'}
              icon={site?.icon}
              iconType={site?.icon_type}
              iconUrl={site?.icon_url}
              iconBackground={site?.icon_background}
              isMobile={isMobile}
              isSidebarCollapsed={isSidebarCollapsed}
              onShowSideBar={() => handleSidebarCollapse(false)}
              onToggleSidebar={() => handleSidebarCollapse(!isSidebarCollapsed)}
              onViewChatSettings={() => setShowChatSettings(true)}
              showChatSettings={isShowingChatSettings}
              currentConversationId={currentConversationId}
              currentConversationName={currentConversationItem?.name}
              isPinned={isPin}
              onTogglePin={() => handleHeaderOperate(isPin ? 'unpin' : 'pin')}
              onRenameConversation={() => handleHeaderOperate('rename')}
              onDeleteConversation={() => handleHeaderOperate('delete')}
            />
          )}
          <div className={cn('flex-1 overflow-hidden', !isMobile && 'pt-0')}>
            {appChatListDataLoading && (
              <Loading type='app' />
            )}
            {!appChatListDataLoading && (
              <ChatWrapper key={chatShouldReloadKey} />
            )}
          </div>
        </div>
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
      {showChatSettings && (
        <div className='fixed inset-0 z-50 flex justify-end bg-background-overlay p-3'
          onClick={() => setShowChatSettings(false)}
        >
          <div className='flex h-full w-[calc(100vw_-_40px)] max-w-md flex-col rounded-xl bg-components-panel-bg shadow-lg backdrop-blur-sm' onClick={e => e.stopPropagation()}>
            <div className='flex items-center gap-3 rounded-t-2xl border-b border-divider-subtle px-4 py-3'>
              <RiChatAiLine className='h-4 w-4 shrink-0 text-text-tertiary' />
              <div className='text-sm system-xl-semibold grow text-text-tertiary'>{t('share.chat.chatSettingsTitle')}</div>
            </div>
            <div className='flex-1 overflow-y-auto p-4'>
              <InputsFormContent />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export type ChatWithHistoryWrapProps = {
  installedAppInfo?: InstalledApp
  className?: string
}
const ChatWithHistoryWrap: FC<ChatWithHistoryWrapProps> = ({
  installedAppInfo,
  className,
}) => {
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const themeBuilder = useThemeContext()

  const {
    appInfoError,
    appInfoLoading,
    userCanAccess,
    appData,
    appParams,
    appMeta,
    appChatListDataLoading,
    currentConversationId,
    currentConversationItem,
    appPrevChatTree,
    pinnedConversationList,
    conversationList,
    newConversationInputs,
    newConversationInputsRef,
    handleNewConversationInputsChange,
    inputsForms,
    handleNewConversation,
    handleStartChat,
    handleChangeConversation,
    handlePinConversation,
    handleUnpinConversation,
    handleDeleteConversation,
    conversationRenaming,
    handleRenameConversation,
    handleNewConversationCompleted,
    chatShouldReloadKey,
    isInstalledApp,
    appId,
    handleFeedback,
    currentChatInstanceRef,
    sidebarCollapseState,
    handleSidebarCollapse,
    clearChatList,
    setClearChatList,
    isResponding,
    setIsResponding,
    currentConversationInputs,
    setCurrentConversationInputs,
    allInputsHidden,
    chatStarted,
    setChatStarted,
  } = useChatWithHistory(installedAppInfo)

  return (
    <ChatWithHistoryContext.Provider value={{
      appInfoError,
      appInfoLoading,
      appData,
      userCanAccess,
      appParams,
      appMeta,
      appChatListDataLoading,
      currentConversationId,
      currentConversationItem,
      appPrevChatTree,
      pinnedConversationList,
      conversationList,
      newConversationInputs,
      newConversationInputsRef,
      handleNewConversationInputsChange,
      inputsForms,
      handleNewConversation,
      handleStartChat,
      handleChangeConversation,
      handlePinConversation,
      handleUnpinConversation,
      handleDeleteConversation,
      conversationRenaming,
      handleRenameConversation,
      handleNewConversationCompleted,
      chatShouldReloadKey,
      isMobile,
      isInstalledApp,
      appId,
      handleFeedback,
      currentChatInstanceRef,
      themeBuilder,
      sidebarCollapseState,
      handleSidebarCollapse,
      clearChatList,
      setClearChatList,
      isResponding,
      setIsResponding,
      currentConversationInputs,
      setCurrentConversationInputs,
      allInputsHidden,
      chatStarted,
      setChatStarted,
    }}>
      <ChatWithHistory className={className} />
    </ChatWithHistoryContext.Provider>
  )
}

const ChatWithHistoryWrapWithCheckToken: FC<ChatWithHistoryWrapProps> = ({
  installedAppInfo,
  className,
}) => {
  const [initialized, setInitialized] = useState(false)
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useAsyncEffect(async () => {
    if (!initialized && isMounted) {
      if (!installedAppInfo) {
        try {
          await checkOrSetAccessToken()
        }
        catch (e: any) {
          if (e.status === 404) {
            setAppUnavailable(true)
          }
          else {
            setIsUnknownReason(true)
            setAppUnavailable(true)
          }
        }
      }
      setInitialized(true)
    }
  }, [isMounted])

  if (!initialized)
    return null

  if (appUnavailable)
    return <AppUnavailable isUnknownReason={isUnknownReason} />

  return (
    <ChatWithHistoryWrap
      installedAppInfo={installedAppInfo}
      className={className}
    />
  )
}

export default ChatWithHistoryWrapWithCheckToken
