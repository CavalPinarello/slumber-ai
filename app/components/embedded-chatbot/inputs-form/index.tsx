import React from 'react'
import { useEmbeddedChatbotContext } from '../context'
import BaseInputsForm from '@/app/components/base/inputs-form'
import InputsFormContent from '@/app/components/base/chat/embedded-chatbot/inputs-form/content'

type Props = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const InputsFormNode = ({
  collapsed,
  setCollapsed,
}: Props) => {
  const context = useEmbeddedChatbotContext()

  return (
    <BaseInputsForm
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      context={context}
      ContentComponent={InputsFormContent}
      variant="embedded"
    />
  )
}

export default InputsFormNode
