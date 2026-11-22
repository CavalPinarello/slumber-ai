import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { cva } from 'class-variance-authority'
import classNames from 'classnames'
import Image from 'next/image'
import style from './style.module.css'

export type AppIconProps = {
  size?: 'xs' | 'tiny' | 'small' | 'medium' | 'large' | 'xl' | 'xxl'
  rounded?: boolean
  background?: string
  imageUrl?: string | null
  icon?: string | null
  iconType?: 'emoji' | 'image'
  iconUrl?: string
  className?: string
}

const appIconVariants = cva(
  'flex items-center justify-center relative text-lg grow-0 shrink-0 overflow-hidden leading-none',
  {
    variants: {
      size: {
        xs: 'w-4 h-4 text-xs',
        tiny: 'w-6 h-6 text-base',
        small: 'w-8 h-8 text-xl',
        medium: 'w-9 h-9 text-[22px]',
        large: 'w-10 h-10 text-[24px]',
        xl: 'w-12 h-12 text-[28px]',
        xxl: 'w-14 h-14 text-[32px]',
      },
      rounded: {
        true: 'rounded-full',
      },
    },
    defaultVariants: {
      size: 'medium',
      rounded: false,
    },
  },
)

function getValidImageSrc(imageUrl?: string | null, icon?: string | null): string {
  // Default fallback icon path - using SVG for better scalability
  const fallbackIcon = '/app-icon.svg'

  if (!imageUrl && icon && /^\p{Emoji}$/u.test(icon))
    return fallbackIcon
  if (icon && icon.length === 2 && /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(icon))
    return fallbackIcon
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')))
    return imageUrl
  if (icon && (icon.startsWith('http://') || icon.startsWith('https://')))
    return icon
  return fallbackIcon
}

const AppIcon: FC<AppIconProps> = ({
  size = 'medium',
  rounded = false,
  background,
  imageUrl,
  icon,
  className,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(getValidImageSrc(imageUrl, icon))
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const newSrc = getValidImageSrc(imageUrl, icon)
    setImageSrc(newSrc)
    setHasError(false)

    // If the new source is already the fallback, set hasError to true
    if (newSrc === '/app-icon.svg' && !imageUrl)
      setHasError(true)

    // Pre-validate Dify signed URLs to prevent 404 errors
    if (imageUrl && imageUrl.includes('timestamp=') && imageUrl.includes('sign=')) {
      try {
        const url = new URL(imageUrl)
        const timestamp = url.searchParams.get('timestamp')
        if (timestamp) {
          const timestampMs = parseInt(timestamp) * 1000
          const now = Date.now()
          // If timestamp is more than 24 hours old, pre-emptively use fallback
          if (now - timestampMs > 24 * 60 * 60 * 1000) {
            console.warn('Signed URL timestamp is old, using fallback icon')
            setHasError(true)
          }
        }
      }
      catch (e) {
        console.warn('Invalid signed URL format, using fallback icon')
        setHasError(true)
      }
    }
  }, [imageUrl, icon])

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true)

      // If the original imageUrl was a signed URL that expired, log the warning
      if (imageUrl && imageUrl.includes('timestamp=') && imageUrl.includes('sign='))
        console.warn('Signed URL may have expired, falling back to default icon:', imageUrl)
      else if (imageUrl)
        console.warn('App icon failed to load, falling back to default icon:', imageUrl)
    }
  }

  return (
    <span
      className={classNames(
        appIconVariants({ size, rounded }),
        style.appIcon,
        size !== 'large' && style[size],
        rounded && style.rounded,
        className ?? '',
      )}
      style={{ background: background ?? 'transparent', position: 'relative' }}
    >
      {hasError ? (
        // Use regular img tag for fallback to avoid Next.js optimization issues
        <img
          src="/app-icon.png"
          alt="App Icon"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            margin: 0,
            padding: 0,
          }}
        />
      ) : (
        <Image
          src={imageSrc}
          alt="App Icon"
          fill
          sizes="100vw"
          quality={100}
          priority
          className="object-cover"
          style={{ margin: 0, padding: 0 }}
          onError={handleImageError}
          unoptimized
        />
      )}
    </span>
  )
}

export default AppIcon
