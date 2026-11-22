export type CodeLanguage = 'python' | 'javascript' | 'json'

export type CodeNodeData = {
  code: string
  language: CodeLanguage
  outputs?: Record<string, any>
}
