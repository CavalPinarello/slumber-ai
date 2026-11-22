// Progressive image loading and optimization system

import React from 'react'
import Image from 'next/image'
import { memoWithShallowCompare } from '@/components/performance/memoization'
import { UnifiedLoading } from '@/components/loading/unified-loading'

/**
 * Progressive image loading hook
 */
export const useProgressiveImage = (src: string, placeholder?: string) => {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)
  const [imageSrc, setImageSrc] = React.useState(placeholder || '')

  React.useEffect(() => {
    const img = new window.Image()

    img.onload = () => {
      setImageSrc(src)
      setImageLoaded(true)
      setImageError(false)
    }

    img.onerror = () => {
      setImageError(true)
      setImageLoaded(false)
    }

    img.src = src
  }, [src])

  return {
    src: imageSrc,
    isLoaded: imageLoaded,
    hasError: imageError,
  }
}

/**
 * Intersection observer hook for lazy loading
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {},
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false)
  const [hasIntersected, setHasIntersected] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element)
      return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected)
          setHasIntersected(true)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      },
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [hasIntersected, options])

  return { ref, isIntersecting, hasIntersected }
}

/**
 * Progressive image component with lazy loading
 */
export type ProgressiveImageProps = {
  src: string
  alt: string
  width?: number
  height?: number
  placeholder?: string
  blurDataURL?: string
  className?: string
  priority?: boolean
  quality?: number
  onLoad?: () => void
  onError?: () => void
  aspectRatio?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

export const ProgressiveImage = memoWithShallowCompare(({
  src,
  alt,
  width,
  height,
  placeholder,
  blurDataURL,
  className,
  priority = false,
  quality = 85,
  onLoad,
  onError,
  aspectRatio,
  objectFit = 'cover',
}: ProgressiveImageProps) => {
  const { ref, hasIntersected } = useIntersectionObserver()
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)

  const shouldLoad = priority || hasIntersected

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className || ''}`}
      style={{
        aspectRatio,
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
      }}
    >
      {shouldLoad ? (
        <>
          {/* Loading placeholder */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background-secondary">
              <UnifiedLoading
                variant="spinner"
                size="sm"
                position="center"
              />
            </div>
          )}

          {/* Error fallback */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background-secondary text-text-tertiary">
              <div className="text-center">
                <div className="text-2xl mb-2">📷</div>
                <div className="text-sm">Failed to load image</div>
              </div>
            </div>
          )}

          {/* Actual image */}
          <Image
            src={src}
            alt={alt}
            fill={!width && !height}
            width={width}
            height={height}
            quality={quality}
            priority={priority}
            placeholder={blurDataURL ? 'blur' : 'empty'}
            blurDataURL={blurDataURL}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              objectFit,
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out',
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </>
      ) : (
        /* Placeholder before intersection */
        <div className="absolute inset-0 bg-background-secondary" />
      )}
    </div>
  )
})

/**
 * Avatar component with progressive loading
 */
export type AvatarProps = {
  src?: string
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
}

export const Avatar = memoWithShallowCompare(({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}: AvatarProps) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  }

  const sizeValues = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  }

  if (!src) {
    return (
      <div className={`
        ${sizeClasses[size]} 
        rounded-full bg-primary-100 text-primary-600 
        flex items-center justify-center font-medium
        ${className || ''}
      `}>
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      width={sizeValues[size]}
      height={sizeValues[size]}
      className={`${sizeClasses[size]} rounded-full ${className || ''}`}
      objectFit="cover"
      quality={90}
    />
  )
})

/**
 * Image gallery with progressive loading
 */
export type ImageGalleryProps = {
  images: Array<{
    id: string
    src: string
    alt: string
    thumbnail?: string
    blurDataURL?: string
  }>
  columns?: number
  gap?: number
  onImageClick?: (image: any, index: number) => void
  className?: string
}

export const ImageGallery = memoWithShallowCompare(({
  images,
  columns = 3,
  gap = 16,
  onImageClick,
  className,
}: ImageGalleryProps) => {
  return (
    <div
      className={`grid ${className || ''}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {images.map((image, index) => (
        <div
          key={image.id}
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => onImageClick?.(image, index)}
        >
          <ProgressiveImage
            src={image.thumbnail || image.src}
            alt={image.alt}
            blurDataURL={image.blurDataURL}
            className="w-full aspect-square rounded-lg"
            objectFit="cover"
          />
        </div>
      ))}
    </div>
  )
})

/**
 * Optimized file image preview
 */
export type FileImagePreviewProps = {
  file: File
  maxWidth?: number
  maxHeight?: number
  quality?: number
  className?: string
}

export const FileImagePreview = memoWithShallowCompare(({
  file,
  maxWidth = 400,
  maxHeight = 300,
  quality = 0.8,
  className,
}: FileImagePreviewProps) => {
  const [previewUrl, setPreviewUrl] = React.useState<string>('')
  const [isProcessing, setIsProcessing] = React.useState(true)

  React.useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setIsProcessing(false)
      return
    }

    const processImage = async () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new window.Image()

        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL(file.type, quality)

          setPreviewUrl(compressedDataUrl)
          setIsProcessing(false)
        }

        img.src = URL.createObjectURL(file)

        return () => {
          URL.revokeObjectURL(img.src)
        }
      }
      catch (error) {
        console.error('Failed to process image:', error)
        setIsProcessing(false)
      }
    }

    processImage()
  }, [file, maxWidth, maxHeight, quality])

  if (isProcessing) {
    return (
      <div className={`flex items-center justify-center bg-background-secondary rounded-lg p-8 ${className || ''}`}>
        <UnifiedLoading
          variant="spinner"
          size="md"
          text="Processing image..."
        />
      </div>
    )
  }

  if (!previewUrl) {
    return (
      <div className={`flex items-center justify-center bg-background-secondary rounded-lg p-8 ${className || ''}`}>
        <div className="text-center text-text-tertiary">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">Invalid image file</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className || ''}`}>
      <img
        src={previewUrl}
        alt="File preview"
        className="w-full h-auto rounded-lg"
        style={{ maxWidth: `${maxWidth}px`, maxHeight: `${maxHeight}px` }}
      />
    </div>
  )
})

/**
 * Utility functions for image optimization
 */
export const imageOptimizationUtils = {
  /**
   * Generate blur data URL for placeholder
   */
  generateBlurDataURL: (width = 10, height = 10, color = '#f3f4f6'): string => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = width
    canvas.height = height

    if (ctx) {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, width, height)
    }

    return canvas.toDataURL()
  },

  /**
   * Calculate optimal image dimensions
   */
  calculateDimensions: (
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ) => {
    let { width, height } = { width: originalWidth, height: originalHeight }

    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height
      height = maxHeight
    }

    return { width: Math.round(width), height: Math.round(height) }
  },

  /**
   * Convert file to WebP format (if supported)
   */
  convertToWebP: async (file: File, quality = 0.8): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new window.Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height

        ctx?.drawImage(img, 0, 0)

        canvas.toBlob(
          blob => resolve(blob),
          'image/webp',
          quality,
        )
      }

      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(file)
    })
  },

  /**
   * Get image metadata
   */
  getImageMetadata: (file: File): Promise<{
    width: number
    height: number
    size: number
    type: string
  }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type,
        })
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  },
}

export default {
  ProgressiveImage,
  Avatar,
  ImageGallery,
  FileImagePreview,
  useProgressiveImage,
  useIntersectionObserver,
  imageOptimizationUtils,
}
