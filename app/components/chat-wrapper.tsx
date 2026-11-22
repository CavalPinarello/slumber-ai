import { useCallback, useEffect, useMemo, useState } from 'react'
import Chat from '../chat'
import type {
  ChatConfig,
  ChatItem,
  ChatItemInTree,
  OnSend,
} from '../types'
import { useChat } from '../chat/hooks'
import { getLastAnswer, isValidGeneratedAnswer } from '../utils'
import type { FileEntity } from '../../file-uploader/types'
import { useChatWithHistoryContext } from './context'
import { InputVarType } from '@/app/components/workflow/types'
import { TransferMethod } from '@/types/app'
import InputsForm from '@/app/components/inputs-form'
import {
  fetchSuggestedQuestions,
  getUrl,
  stopChatMessageResponding,
} from '@/service/share'
import AnswerIcon from '@/app/components/base/answer-icon'
import SuggestedQuestions from '@/app/chat/answer/suggested-questions'
import { Markdown } from '@/app/components/base/markdown'
import cn from '@/utils/classnames'

const ChatWrapper = () => {
  const {
    appParams,
    appPrevChatTree,
    currentConversationId,
    currentConversationItem,
    currentConversationInputs,
    inputsForms,
    newConversationInputs,
    newConversationInputsRef,
    handleNewConversationCompleted,
    isMobile,
    isInstalledApp,
    appId,
    appMeta,
    handleFeedback,
    currentChatInstanceRef,
    appData,
    themeBuilder,
    sidebarCollapseState,
    clearChatList,
    setClearChatList,
    setIsResponding,
    allInputsHidden,
    chatStarted,
  } = useChatWithHistoryContext()
  const appConfig = useMemo(() => {
    // Hardcoded fallback welcome message for when API fails
    const fallbackOpeningStatement = `Welcome to Slumber AI! 👋

I'm here to help you prepare for your sleep surgery with personalized medical guidance.

Please fill out the intake form ${!isMobile ? 'below' : 'above'} first ☝️

Then you can:
• Ask unlimited questions about your specific surgery
• Get detailed, evidence-based answers
• When you're done, we'll direct you to a quick feedback survey

When you're done asking questions, just say "that's all" or "no more questions" and we'll provide you with a survey link.

Let's get started! What would you like to know about your surgery?`;
    
    const config = appParams || {
      opening_statement: fallbackOpeningStatement,
      suggested_questions: [],
      features: {
        text_to_speech: { enabled: false },
        speech_to_text: { enabled: false },
        file_upload: {
          enabled: false,
          allowed_file_types: [],
          allowed_file_extensions: [],
          allowed_file_upload_methods: [],
          number_limits: 0,
          fileUploadConfig: {},
        },
        citation: { enabled: false },
        moderation: { enabled: false },
        annotation_reply: { enabled: false },
      },
      user_input_form: [],
    }

    // Always ensure opening_statement has a value
    const finalOpeningStatement = currentConversationId 
      ? currentConversationItem?.introduction 
      : ((config as any).opening_statement || fallbackOpeningStatement);
      
    return {
      ...config,
      file_upload: {
        ...(config as any).file_upload,
        fileUploadConfig: (config as any).system_parameters || {},
      },
      supportFeedback: true,
      opening_statement: finalOpeningStatement || fallbackOpeningStatement, // Double fallback
    } as ChatConfig
  }, [appParams, currentConversationItem?.introduction, currentConversationId, isMobile])
  const {
    chatList,
    setTargetMessageId,
    handleSend,
    handleStop,
    isResponding: respondingState,
    suggestedQuestions,
  } = useChat(
    appConfig,
    {
      inputs: (currentConversationId ? currentConversationInputs : newConversationInputs) as any,
      inputsForm: inputsForms,
    },
    appPrevChatTree,
    taskId => stopChatMessageResponding('', taskId, isInstalledApp, appId),
    clearChatList,
    setClearChatList,
  )
  const inputsFormValue = currentConversationId ? currentConversationInputs : newConversationInputsRef?.current

  const inputDisabled = useMemo(() => {
    if (allInputsHidden)
      return false

    // Chat is disabled if chat hasn't been started
    if (!chatStarted)
      return true

    let hasEmptyInput = ''
    let fileIsUploading = false
    const requiredVars = inputsForms.filter(({ required }) => required)
    if (requiredVars.length) {
      requiredVars.forEach(({ variable, label, type }) => {
        if (hasEmptyInput)
          return

        if (fileIsUploading)
          return

        if (!inputsFormValue?.[variable])
          hasEmptyInput = label as string

        if ((type === InputVarType.singleFile || type === InputVarType.multiFiles) && inputsFormValue?.[variable]) {
          const files = inputsFormValue[variable]
          if (Array.isArray(files))
            fileIsUploading = files.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)
          else
            fileIsUploading = files.transferMethod === TransferMethod.local_file && !files.uploadedId
        }
      })
    }
    if (hasEmptyInput)
      return true

    if (fileIsUploading)
      return true
    return false
  }, [inputsFormValue, inputsForms, allInputsHidden, chatStarted])

  useEffect(() => {
    if (currentChatInstanceRef.current)
      currentChatInstanceRef.current.handleStop = handleStop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setIsResponding(respondingState)
  }, [respondingState, setIsResponding])

  const doSend: OnSend = useCallback((message, files, isRegenerate = false, parentAnswer: ChatItem | null = null) => {
    // console.log('🔍 doSend called with message:', message.substring(0, 50) + '...', 'Stack trace:', new Error().stack)
    
    const data: any = {
      query: message,
      files,
      inputs: currentConversationId ? currentConversationInputs : newConversationInputs,
      conversation_id: currentConversationId,
      parent_message_id: (isRegenerate ? parentAnswer?.id : getLastAnswer(chatList)?.id) || null,
    }

    handleSend(
      getUrl('chat-messages', isInstalledApp, appId || ''),
      data,
      {
        onGetSuggestedQuestions: responseItemId => fetchSuggestedQuestions(responseItemId, isInstalledApp, appId),
        onConversationComplete: currentConversationId ? undefined : handleNewConversationCompleted,
        isPublicAPI: !isInstalledApp,
      },
    )
  }, [chatList, handleNewConversationCompleted, handleSend, currentConversationId, currentConversationInputs, newConversationInputs, isInstalledApp, appId])

  const doRegenerate = useCallback((chatItem: ChatItemInTree, editedQuestion?: { message: string; files?: FileEntity[] }) => {
    const question = editedQuestion ? chatItem : chatList.find(item => item.id === chatItem.parentMessageId)!
    const parentAnswer = chatList.find(item => item.id === question.parentMessageId)
    doSend(editedQuestion ? editedQuestion.message : question.content,
      editedQuestion ? editedQuestion.files : question.message_files,
      true,
      isValidGeneratedAnswer(parentAnswer) ? parentAnswer : null,
    )
  }, [chatList, doSend])

  const messageList = useMemo(() => {
    if (currentConversationId)
      return chatList
    return chatList.filter(item => !item.isOpeningStatement)
  }, [chatList, currentConversationId])

  // Start with configuration panel collapsed on desktop to show instructions first
  // On mobile, start expanded for immediate visibility
  const [collapsed, setCollapsed] = useState(() => {
    if (currentConversationId) return true
    return !isMobile // Desktop starts collapsed, mobile starts expanded
  })

  const chatNode = useMemo(() => {
    if (allInputsHidden || !inputsForms.length)
      return null
    if (isMobile) {
      if (!currentConversationId)
        return <InputsForm collapsed={false} setCollapsed={setCollapsed} />
      return null
    }
    else {
      return <InputsForm collapsed={collapsed} setCollapsed={setCollapsed} />
    }
  }, [inputsForms.length, isMobile, currentConversationId, collapsed, allInputsHidden])

  const welcome = useMemo(() => {
    const welcomeMessage = chatList.find(item => item.isOpeningStatement)
    if (respondingState)
      return null
    if (currentConversationId)
      return null
    
    // If no welcome message in chatList, create a fallback
    const fallbackWelcome = `Welcome to Slumber AI! 👋

I'm here to help you prepare for your sleep surgery with personalized medical guidance.

Please fill out the intake form ${!isMobile ? 'below' : 'above'} first ☝️

Then you can:
• Ask unlimited questions about your specific surgery
• Get detailed, evidence-based answers
• When you're done, we'll direct you to a quick feedback survey

When you're done asking questions, just say "that's all" or "no more questions" and we'll provide you with a survey link.

Let's get started! What would you like to know about your surgery?`;
    
    const messageContent = welcomeMessage?.content || fallbackWelcome
    const hasSuggestions = welcomeMessage?.suggestedQuestions && welcomeMessage.suggestedQuestions.length > 0
    
    // Always show either the welcome message or fallback
    if (hasSuggestions) {
      return (
        <div className={cn('flex items-center justify-center px-4', isMobile ? 'py-4 min-h-0' : 'py-8')}>
          <div className='flex max-w-[720px] grow'>
            <div className='w-0 grow'>
              <div className={cn('grow rounded-2xl bg-components-panel-bg px-4 py-3 text-text-primary', isMobile ? 'body-md-regular' : 'body-lg-regular')}>
                <Markdown content={messageContent} />
                {welcomeMessage && <SuggestedQuestions item={welcomeMessage} />}
              </div>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3', isMobile ? 'py-4 min-h-0' : 'py-8')}>
        <div className={cn('max-w-[868px] px-4')}>
          <Markdown className={cn('!text-text-primary', isMobile ? '!body-lg-regular' : '!body-xl-regular')} content={messageContent} />
        </div>
      </div>
    )
  }, [appData?.site.icon, appData?.site.icon_background, appData?.site.icon_type, appData?.site.icon_url, chatList, collapsed, currentConversationId, inputsForms.length, respondingState, allInputsHidden, isMobile])

  const answerIcon = (appData?.site && appData.site.use_icon_as_answer_icon)
    ? <AnswerIcon
      iconType={appData.site.icon_type}
      icon={appData.site.icon}
      background={appData.site.icon_background}
      imageUrl={appData.site.icon_url}
    />
    : null

  return (
    <div
      className='h-full overflow-hidden'
    >
      <Chat
        appData={appData}
        config={appConfig}
        chatList={messageList}
        isResponding={respondingState}
        noChatInput={!chatStarted}
        chatContainerInnerClassName={`mx-auto pt-5 w-full max-w-[868px] ${isMobile && 'px-4'}`}
        chatFooterClassName='pb-10 sm:pb-6'
        chatFooterInnerClassName={`mx-auto w-full max-w-[868px] ${isMobile ? 'px-2' : 'px-4'}`}
        onSend={doSend}
        inputs={currentConversationId ? currentConversationInputs as any : newConversationInputs}
        inputsForm={inputsForms}
        onRegenerate={doRegenerate}
        onStopResponding={handleStop}
        chatNode={
          <>
            {/* Always show welcome/instructions first, then configuration panel */}
            {welcome}
            {chatNode}
          </>
        }
        allToolIcons={appMeta?.tool_icons || {}}
        onFeedback={handleFeedback}
        suggestedQuestions={suggestedQuestions}
        answerIcon={answerIcon}
        hideProcessDetail={true}
        themeBuilder={themeBuilder}
        switchSibling={siblingMessageId => setTargetMessageId(siblingMessageId)}
        inputDisabled={inputDisabled}
        isMobile={isMobile}
        sidebarCollapseState={sidebarCollapseState}
      />
    </div>
  )
}

export default ChatWrapper
