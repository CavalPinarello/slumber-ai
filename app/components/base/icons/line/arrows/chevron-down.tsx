import type { FC } from 'react'

type Props = {
  className?: string
}

const ChevronDown: FC<Props> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default ChevronDown
