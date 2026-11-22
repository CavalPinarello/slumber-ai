import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { API_KEY, API_URL } from '@/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl?.searchParams
    const imageUrl = searchParams?.get('url')

    // Only log in development to reduce console noise
    if (process.env.NODE_ENV !== 'production')
      console.log('Image proxy request:', { imageUrl, searchParams: !!searchParams })

    if (!imageUrl) {
      if (process.env.NODE_ENV !== 'production')
        console.error('No URL parameter provided')
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 },
      )
    }

    if (process.env.NODE_ENV !== 'production')
      console.log('Proxying image from:', imageUrl)

    // Enhanced headers for API authentication and better compatibility
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': API_URL || 'https://api.dify.ai/v1',
      'Origin': API_URL || 'https://api.dify.ai',
    }

    // For signed URLs, don't add extra authentication headers that might interfere
    const isSignedUrl = imageUrl.includes('timestamp=') && imageUrl.includes('sign=')
    if (isSignedUrl) {
      // Use minimal headers for signed URLs as they are self-authenticating
      console.log('Detected signed URL, using minimal headers for signature-based authentication')
      console.log('Attempting to fetch signed URL:', imageUrl)

      // Log file access attempt after configuration fix
      if (imageUrl.includes('/files/'))
        console.log('Attempting file access after configuration fix')

      const signedHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      }

      const response = await fetch(imageUrl, {
        headers: signedHeaders,
        redirect: 'follow',
      })

      if (!response.ok) {
        console.error('Signed URL failed, status:', response.status)
        console.error('Signed URL that failed:', imageUrl)

        // Try to extract file ID and access MinIO public endpoint directly
        const fileIdMatch = imageUrl.match(/\/files\/([a-f0-9-]+)\//)
        if (fileIdMatch) {
          const fileId = fileIdMatch[1]
          console.log('Extracted file ID, trying MinIO private network:', fileId)

          // Check if we're in local development or Railway production
          const isLocal = process.env.NODE_ENV === 'development' || !process.env.RAILWAY_ENVIRONMENT

          let minioEndpoints = []

          if (isLocal) {
            // Local development - MinIO access not available
            console.log('Local development detected - MinIO private network not accessible')
            minioEndpoints = []
          }
          else {
            // Railway production - use private network
            console.log('Railway production detected - using private network')
            minioEndpoints = [
              `http://storage.railway.internal:9000/difyai/files/${fileId}`,
              `http://storage.railway.internal:9000/difyai/${fileId}`,
              `http://storage.railway.internal:9000/files/${fileId}`,
              `http://storage.railway.internal:9000/${fileId}`,
            ]
          }

          for (const minioUrl of minioEndpoints) {
            try {
              console.log('Attempting MinIO private network:', minioUrl)

              const minioResponse = await fetch(minioUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': '*/*',
                },
              })

              if (minioResponse.ok) {
                console.log('MinIO private network success with URL:', minioUrl)
                const contentType = minioResponse.headers.get('content-type') || 'image/jpeg'
                const imageBuffer = await minioResponse.arrayBuffer()

                return new NextResponse(imageBuffer, {
                  headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*',
                  },
                })
              }
              else {
                console.log('MinIO endpoint failed:', minioUrl, 'Status:', minioResponse.status)
              }
            }
            catch (minioError) {
              console.error('MinIO endpoint error:', minioUrl, minioError)
            }
          }

          // Try multiple endpoints for direct file access, including MinIO-aware endpoints
          const directEndpoints = [
            `files/${fileId}/file-preview`,
            `files/${fileId}/download`,
            `files/${fileId}`,
            `files/${fileId}/content`,
            `files/${fileId}/data`,
            `storage/files/${fileId}`,
            `media/${fileId}`,
          ]

          for (const endpoint of directEndpoints) {
            try {
              console.log(`Trying direct file endpoint: ${API_URL}/${endpoint}`)
              const directFileResponse = await fetch(`${API_URL}/${endpoint}`, {
                headers: {
                  'Authorization': `Bearer ${API_KEY}`,
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
              })

              console.log(`Direct file endpoint ${endpoint} response status:`, directFileResponse.status)

              if (directFileResponse.ok) {
                console.log('Direct file API success for file ID:', fileId, 'endpoint:', endpoint)
                const contentType = directFileResponse.headers.get('content-type') || 'image/jpeg'
                const imageBuffer = await directFileResponse.arrayBuffer()

                return new NextResponse(imageBuffer, {
                  headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*',
                  },
                })
              }
            }
            catch (directError) {
              console.error(`Direct file API error for endpoint ${endpoint}:`, directError)
            }
          }
          console.error('All direct file API endpoints failed for file ID:', fileId)
        }

        const errorText = await response.text().catch(() => 'Unable to read error text')
        console.error('Signed URL error details:', errorText)
        return NextResponse.json(
          { error: 'Failed to fetch signed image', status: response.status, details: errorText },
          { status: response.status },
        )
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const imageBuffer = await response.arrayBuffer()

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Add API authorization for non-signed URLs from the same API domain
    const apiHost = API_URL ? new URL(API_URL).hostname : 'api.dify.ai'
    if (imageUrl.includes(apiHost) && API_KEY)
      fetchHeaders.Authorization = `Bearer ${API_KEY}`

    console.log('Using headers:', Object.keys(fetchHeaders))

    const response = await fetch(imageUrl, {
      headers: fetchHeaders,
      redirect: 'follow',
    })

    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText)
      console.error('Image URL that failed:', imageUrl)
      const errorText = await response.text().catch(() => 'Unable to read error text')
      console.error('Image proxy error details:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch image', status: response.status, details: errorText },
        { status: response.status },
      )
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const imageBuffer = await response.arrayBuffer()

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
  catch (error) {
    console.error('Error proxying image:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}
