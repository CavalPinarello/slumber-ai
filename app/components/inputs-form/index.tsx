import React from 'react'
import { useChatWithHistoryContext } from '../context'
import BaseInputsForm from '@/app/components/base/inputs-form'
import InputsFormContent from '@/app/components/inputs-form/content'

type Props = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const InputsFormNode = ({
  collapsed,
  setCollapsed,
}: Props) => {
  const context = useChatWithHistoryContext()

  return (
    <BaseInputsForm
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      context={context}
      ContentComponent={InputsFormContent}
      variant="default"
    />
  )
}

export default InputsFormNode
