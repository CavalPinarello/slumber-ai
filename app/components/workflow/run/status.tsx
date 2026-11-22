import type { FC } from 'react'

type StatusProps = {
  status: string
  className?: string
}

const Status: FC<StatusProps> = ({ status, className }) => {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${className}`}>
      {status}
    </span>
  )
}

export default Status
