import type { FC } from 'react'

type BlockIconProps = {
  type?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const BlockIcon: FC<BlockIconProps> = ({ type, className, size = 'md' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size]

  return (
    <div className={`inline-flex items-center justify-center rounded bg-gray-200 ${sizeClass} ${className}`}>
      <span className="text-xs">{type?.charAt(0)?.toUpperCase() || '?'}</span>
    </div>
  )
}

export default BlockIcon
