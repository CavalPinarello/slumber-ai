import React from 'react'
import ReactMarkdown from 'react-markdown'
import 'katex/dist/katex.min.css'
import RemarkMath from 'remark-math'
import RemarkBreaks from 'remark-breaks'
import RehypeKatex from 'rehype-katex'
import RemarkGfm from 'remark-gfm'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atelierHeathLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'

export function Markdown(props: {
  content: string
  onButtonClick?: (message: string) => void
  selectedButtons?: string[]
  onButtonToggle?: (message: string) => void
  onMultipleSubmit?: (messages: string[]) => void
}) {
  const { content, onButtonClick, selectedButtons = [], onButtonToggle, onMultipleSubmit } = props

  // Log the raw content to see what we're working with
  // console.log('=== MARKDOWN COMPONENT DEBUG ===')
  // console.log('Raw content received:', JSON.stringify(content))
  // console.log('Content length:', content.length)
  // console.log('Contains <button:', content.includes('<button'))
  // console.log('Contains button text:', content.toLowerCase().includes('button'))
  // console.log('====================================')

  // HTML内のボタンタグを抽出してReactコンポーネントに変換
  const renderContentWithButtons = (htmlContent: string) => {
    // console.log('Processing content:', htmlContent)
    // console.log('Has button tags:', htmlContent.includes('<button'))
    // data-variantも取得できるよう正規表現を修正
    const buttonRegex = /<button[^>]*data-message="([^"]*)"[^>]*(?:data-variant="([^"]*)")?[^>]*>([^<]*)<\/button>/g

    // Also check for regular button tags without data attributes
    const regularButtonRegex = /<button(?![^>]*data-message)[^>]*>([^<]*)<\/button>/g

    // ボタンタグをすべて抽出
    const buttons = []
    const multipleButtons = []
    let match

    // Process buttons with data-message attributes first
    while ((match = buttonRegex.exec(htmlContent)) !== null) {
      const fullMatch = match[0]
      const message = match[1]
      const buttonText = match[match.length - 1] // 最後の要素がbuttonText

      // data-variantを抽出
      const variantMatch = fullMatch.match(/data-variant="([^"]*)"/)
      const variant = variantMatch ? variantMatch[1] : 'secondary' // デフォルトはsecondary

      const isMultiple = variant === 'secondary'
      const isSelected = selectedButtons.includes(message)

      let buttonClass
      if (isMultiple) {
        // 複数選択ボタン（secondary）
        buttonClass = isSelected
          ? 'inline-flex items-center px-3 py-1.5 text-sm text-components-button-secondary-accent-text bg-components-button-tertiary-bg border-[0.5px] border-components-button-primary-border rounded-md hover:bg-components-button-tertiary-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 cursor-pointer'
          : 'inline-flex items-center px-3 py-1.5 text-sm text-components-button-secondary-text bg-components-button-secondary-bg border-[0.5px] border-components-button-secondary-border rounded-md hover:border-components-button-secondary-border-hover hover:bg-components-button-secondary-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 cursor-pointer'
      }
      else {
        // 単一選択ボタン（primary）
        buttonClass = 'inline-flex items-center px-4 py-2 text-sm text-white bg-primary-400 rounded-lg hover:bg-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer'
      }

      const button = (
        <button
          key={`button-${message}`}
          className={buttonClass}
          onClick={() => {
            // console.log('Button clicked:', { message, isMultiple, buttonText, variant })
            // console.log('Callbacks:', { onButtonClick, onButtonToggle })
            isMultiple ? onButtonToggle?.(message) : onButtonClick?.(message)
          }}
        >
          {buttonText}
        </button>
      )

      buttons.push(button)
      if (isMultiple)
        multipleButtons.push(button)
    }

    // Also process regular buttons without data-message attributes
    let regularMatch
    while ((regularMatch = regularButtonRegex.exec(htmlContent)) !== null) {
      const buttonText = regularMatch[1]
      const message = buttonText // Use button text as message for regular buttons

      // console.log('Found regular button:', buttonText)

      // Treat regular buttons as primary (single-click) buttons
      const buttonClass = 'inline-flex items-center px-4 py-2 text-sm text-white bg-primary-400 rounded-lg hover:bg-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer'

      const button = (
        <button
          key={`regular-button-${buttonText}`}
          className={buttonClass}
          onClick={() => {
            // console.log('Regular button clicked:', { message: buttonText })
            // console.log('Callbacks:', { onButtonClick })
            onButtonClick?.(buttonText)
          }}
        >
          {buttonText}
        </button>
      )

      buttons.push(button)
    }

    // ボタンタグを取り除いたテキスト部分
    const textContent = htmlContent
      .replace(/<button[^>]*data-message="([^"]*)"[^>]*>([^<]*)<\/button>/g, '')
      .replace(/<button(?![^>]*data-message)[^>]*>([^<]*)<\/button>/g, '') // Regular buttons も除去
      .replace(/\n\s*$/g, '') // 末尾の改行と空白を除去
      .trim()

    const parts = []

    // テキスト部分をMarkdownとして処理
    if (textContent) {
      parts.push(
        <div key="text-content">
          <ReactMarkdown
            remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
            rehypePlugins={[RehypeKatex]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              a: ({ href, children, ...props }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              ),
              code({ node, inline, className, children, ...props }) {
                if (inline)
                  return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>

                const match = /language-(\w+)/.exec(className || '')
                return match
                  ? (
                    <SyntaxHighlighter
                      {...props}
                      children={String(children).replace(/\n$/, '')}
                      style={atelierHeathLight}
                      language={match[1]}
                      showLineNumbers
                      PreTag="div"
                    />
                  )
                  : (
                    <code className="block bg-gray-100 p-2 rounded text-sm" {...props}>
                      {children}
                    </code>
                  )
              },
            }}
          >
            {textContent}
          </ReactMarkdown>
        </div>,
      )
    }

    // ボタン部分（横並び）
    if (buttons.length > 0) {
      parts.push(
        <div key="buttons" className="flex flex-wrap gap-2" style={{ marginTop: textContent ? '16px' : '0', marginBottom: textContent ? '4px' : '0' }}>
          {buttons}
        </div>,
      )
    }

    // 複数選択ボタン（secondary）がある場合のみ送信ボタンを追加
    if (multipleButtons.length > 0 && selectedButtons.length > 0) {
      parts.push(
        <div key="submit-area" className="mt-3">
          <button
            className="inline-flex items-center px-4 py-2 text-sm text-white bg-primary-400 border border-primary-500 rounded-lg hover:bg-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 cursor-pointer"
            onClick={() => onMultipleSubmit?.(selectedButtons)}
          >
            選択した内容を送信 ({selectedButtons.length}件選択中)
          </button>
        </div>,
      )
    }

    return parts
  }

  // グローバル関数を設定
  React.useEffect(() => {
    window.handleButtonClick = (message: string) => {
      onButtonClick?.(message)
    }

    window.handleButtonToggle = (message: string) => {
      onButtonToggle?.(message)
    }

    window.handleMultipleSubmit = () => {
      onMultipleSubmit?.(selectedButtons)
    }

    return () => {
      delete window.handleButtonClick
      delete window.handleButtonToggle
      delete window.handleMultipleSubmit
    }
  }, [onButtonClick, onButtonToggle, onMultipleSubmit, selectedButtons])

  // ボタンタグの完全性をチェック
  const hasIncompleteButton = (text: string) => {
    // <button で始まっているが </button> で終わっていない場合
    const openTags = (text.match(/<button/g) || []).length
    const closeTags = (text.match(/<\/button>/g) || []).length
    return openTags > closeTags
  }

  // 完全なボタンタグのみを抽出
  const getCompleteButtons = (text: string) => {
    const buttonRegex = /<button[^>]*data-message="([^"]*)"[^>]*>([^<]*)<\/button>/g
    const matches = []
    let match
    while ((match = buttonRegex.exec(text)) !== null)
      matches.push(match[0])

    return matches
  }

  const hasAnyButton = content.includes('<button')
  const completeButtons = getCompleteButtons(content)
  const hasCompleteButtons = completeButtons.length > 0

  // console.log('Content:', content)
  // console.log('Has any button:', hasAnyButton)
  // console.log('Complete buttons count:', completeButtons.length)
  // console.log('Has incomplete button:', hasIncompleteButton(content))

  if (hasAnyButton) {
    // 完全なボタンタグだけを含むコンテンツを作成
    let processedContent = content

    // 不完全なボタンタグを除去
    if (hasIncompleteButton(content)) {
      // 最後の不完全な<buttonタグ以降を削除
      processedContent = content.replace(/<button(?![^<]*<\/button>)[^<]*$/s, '')
    }

    const buttonComponents = renderContentWithButtons(processedContent)
    // console.log('Button components:', buttonComponents)

    return (
      <div className="markdown-body">
        {buttonComponents}
      </div>
    )
  }

  // 不完全なボタンタグがある場合は、それを一時的に隠してMarkdownとして処理
  const processedContent = hasIncompleteButton(content)
    ? content.replace(/<button(?![^>]*<\/button>).*$/s, '') // 不完全なボタンタグ以降を削除
    : content

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
        rehypePlugins={[
          RehypeKatex,
        ]}
        components={{
          a: ({ href, children, ...props }) => {
            // Check if this link should be rendered as a button
            const childText = String(children || '').trim()
            const isButtonLike = !href || href === '#' || href === 'javascript:void(0)'

            // console.log('Link component:', { href, children, childText, isButtonLike })

            if (isButtonLike) {
              // Render as a clickable button instead of a link
              return (
                <button
                  className="inline-flex items-center px-4 py-2 text-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer mr-2 mb-2"
                  style={{ backgroundColor: '#B50034' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C32844'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#B50034'}
                  onClick={() => {
                    // console.log('Markdown button-link clicked:', childText)
                    onButtonClick?.(childText)
                  }}
                  {...props}
                >
                  {children}
                </button>
              )
            }

            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            )
          },
          span: ({ className, children, ...props }) => {
            const childText = String(children || '').trim()
            // console.log('Span component:', { className, children, childText })

            // Check if this span has button-like styling
            if (className && (className.includes('btn') || className.includes('button') || className.includes('bg-primary'))) {
              // console.log('Button-like span detected:', childText)
              return (
                <button
                  className="inline-flex items-center px-4 py-2 text-sm text-white bg-primary-400 rounded-lg hover:bg-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer mr-2 mb-2"
                  onClick={() => {
                    // console.log('Span button clicked:', childText)
                    onButtonClick?.(childText)
                  }}
                >
                  {children}
                </button>
              )
            }

            return <span className={className} {...props}>{children}</span>
          },
          div: ({ className, children, ...props }) => {
            const childText = String(children || '').trim()
            // console.log('Div component:', { className, children, childText })

            // Check if this div has button-like styling
            if (className && (className.includes('btn') || className.includes('button') || className.includes('bg-primary'))) {
              // console.log('Button-like div detected:', childText)
              return (
                <button
                  className="inline-flex items-center px-4 py-2 text-sm text-white bg-primary-400 rounded-lg hover:bg-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer mr-2 mb-2"
                  onClick={() => {
                    // console.log('Div button clicked:', childText)
                    onButtonClick?.(childText)
                  }}
                >
                  {children}
                </button>
              )
            }

            return <div className={className} {...props}>{children}</div>
          },
          p: ({ className, children, ...props }) => {
            // Remove console.log for production
            // console.log('Paragraph component:', { className, children })

            // Check if this paragraph contains button-like elements
            if (className && className.includes('flex')) {
              // console.log('Flex paragraph detected:', children)

              // If it's a flex container, it might contain button-like elements
              if (React.Children.count(children) > 1) {
                return (
                  <div className={className} {...props}>
                    {React.Children.map(children, (child, index) => {
                      if (typeof child === 'string' && child.trim()) {
                        // Convert text content to clickable buttons
                        return (
                          <button
                            key={index}
                            className="inline-flex items-center px-4 py-2 text-sm text-white bg-primary-400 rounded-lg hover:bg-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer mr-2 mb-2"
                            onClick={() => {
                              // console.log('Flex child button clicked:', child.trim())
                              onButtonClick?.(child.trim())
                            }}
                          >
                            {child.trim()}
                          </button>
                        )
                      }
                      return child
                    })}
                  </div>
                )
              }
            }

            return <p className={className} {...props}>{children}</p>
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return (!inline && match)
              ? (
                <SyntaxHighlighter
                  {...props}
                  children={String(children).replace(/\n$/, '')}
                  style={atelierHeathLight}
                  language={match[1]}
                  showLineNumbers
                  PreTag="div"
                />
              )
              : (
                <code {...props} className={className}>
                  {children}
                </code>
              )
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
