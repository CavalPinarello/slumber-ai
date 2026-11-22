import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl?.searchParams
    const fileId = searchParams?.get('fileId')

    console.log('MinIO proxy request for file ID:', fileId)

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID parameter is required' },
        { status: 400 },
      )
    }

    // Use MinIO private endpoint via internal network
    const minioPrivateEndpoint = 'http://storage.railway.internal:9000'
    const bucketName = 'difyai'

    // Try multiple file path patterns within MinIO
    const minioPathPatterns = [
      `${minioPrivateEndpoint}/${bucketName}/files/${fileId}`,
      `${minioPrivateEndpoint}/${bucketName}/${fileId}`,
      `${minioPrivateEndpoint}/files/${fileId}`,
      `${minioPrivateEndpoint}/${fileId}`,
    ]

    console.log('Attempting MinIO private network access for file:', fileId)

    for (const minioUrl of minioPathPatterns) {
      try {
        console.log('Trying MinIO path:', minioUrl)

        const response = await fetch(minioUrl, {
          headers: {
            'User-Agent': 'Dify-API-Proxy/1.0',
            'Accept': '*/*',
          },
        })

        if (response.ok) {
          console.log('MinIO private access success with path:', minioUrl)
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
        else {
          console.log('MinIO path failed:', minioUrl, 'Status:', response.status)
        }
      }
      catch (error) {
        console.error('MinIO path error:', minioUrl, error)
      }
    }

    return NextResponse.json(
      { error: 'File not found in MinIO', fileId },
      { status: 404 },
    )
  }
  catch (error) {
    console.error('MinIO proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}
