import type { FC } from 'react'

type CodeEditorProps = {
  value?: string
  language?: string
  readOnly?: boolean
  className?: string
}

const CodeEditor: FC<CodeEditorProps> = ({ value, language, readOnly, className }) => {
  return (
    <pre className={`bg-gray-100 p-3 rounded text-sm ${className}`}>
      {value || '// No code to display'}
    </pre>
  )
}

export default CodeEditor
