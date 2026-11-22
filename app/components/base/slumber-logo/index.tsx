'use client'
import type { FC } from 'react'
import classNames from '@/utils/classnames'
import useTheme from '@/hooks/use-theme'
import { basePath } from '@/utils/var'

export type SlumberLogoSize = 'large' | 'medium' | 'small'

export const slumberLogoSizeMap: Record<SlumberLogoSize, string> = {
  large: 'w-10 h-10',
  medium: 'w-8 h-8',
  small: 'w-6 h-6',
}

type SlumberLogoProps = {
  size?: SlumberLogoSize
  className?: string
}

const SlumberLogo: FC<SlumberLogoProps> = ({
  size = 'large',
  className,
}) => {
  const { theme } = useTheme()
  const logoPath = theme === 'dark' ? '/slumber_logo_light.svg' : '/slumber_logo.svg'

  return (
    <img
      src={`${basePath}${logoPath}`}
      className={classNames('block object-contain', slumberLogoSizeMap[size], className)}
      alt='Slumber AI logo'
    />
  )
}

export default SlumberLogo
