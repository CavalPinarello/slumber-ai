import type { FC } from 'react'

type Props = {
  className?: string
}

const Loading02: FC<Props> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      opacity="0.25"
    />
    <path
      d="M22 12a10 10 0 0 1-10 10"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.75"
    />
  </svg>
)

export default Loading02
