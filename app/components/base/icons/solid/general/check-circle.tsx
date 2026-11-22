import type { FC } from 'react'

type Props = {
  className?: string
}

const CheckCircle: FC<Props> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.1" />
    <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default CheckCircle
