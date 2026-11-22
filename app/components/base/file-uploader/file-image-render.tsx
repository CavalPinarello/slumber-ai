import cn from '@/utils/classnames'
import { getProxiedImageUrl } from '@/utils/image-proxy'

type FileImageRenderProps = {
  imageUrl: string
  className?: string
  alt?: string
  onLoad?: () => void
  onError?: () => void
  showDownloadAction?: boolean
}
const FileImageRender = ({
  imageUrl,
  className,
  alt,
  onLoad,
  onError,
  showDownloadAction,
}: FileImageRenderProps) => {
  return (
    <div className={cn('border-[2px] border-effects-image-frame shadow-xs', className)}>
      <img
        className={cn('h-full w-full object-cover', showDownloadAction && 'cursor-pointer')}
        alt={alt || 'Preview'}
        onLoad={onLoad}
        onError={onError}
        src={getProxiedImageUrl(imageUrl)}
      />
    </div>
  )
}

export default FileImageRender
