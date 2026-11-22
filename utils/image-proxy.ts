/**
 * Get the appropriate image URL, using proper API endpoints for file access
 * @param url The original image URL
 * @returns The URL to use (either direct, via MinIO public endpoint, or via image-proxy)
 */
export const getProxiedImageUrl = (url?: string): string | undefined => {
  if (!url || !url.startsWith('http'))
    return url

  // For now, continue using image-proxy until we can test the MinIO public endpoint
  // TODO: Once MinIO public endpoint is confirmed working, implement direct access
  console.log('Processing image URL via proxy:', url)

  // For signed URLs or other URLs, use the image proxy
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}
