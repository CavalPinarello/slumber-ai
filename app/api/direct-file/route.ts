import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { API_KEY, API_URL } from '@/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl?.searchParams
    const fileId = searchParams?.get('id')

    // Reduce console logging in production and PWA mode
    if (process.env.NODE_ENV !== 'production')
      console.log('Direct file request:', { fileId })

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID parameter is required' },
        { status: 400 },
      )
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 },
      )
    }

    if (process.env.NODE_ENV !== 'production')
      console.log('Fetching file directly from API:', fileId)

    // Try multiple API endpoints for file access
    const endpoints = [
      `files/${fileId}`,
      `files/${fileId}/file-preview`,
      `files/${fileId}/download`,
      `files/${fileId}/content`,
      `files/${fileId}/view`,
    ]

    let response
    let lastError

    for (const endpoint of endpoints) {
      try {
        if (process.env.NODE_ENV !== 'production')
          console.log(`Trying endpoint: ${API_URL}/${endpoint}`)

        response = await fetch(`${API_URL}/${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        })

        if (process.env.NODE_ENV !== 'production')
          console.log(`Endpoint ${endpoint} response status:`, response.status)

        if (response.ok) {
          if (process.env.NODE_ENV !== 'production')
            console.log(`Success with endpoint: ${endpoint}`)

          break
        }

        lastError = `${endpoint}: ${response.status} ${response.statusText}`
      }
      catch (error) {
        lastError = `${endpoint}: ${error.message}`
        if (process.env.NODE_ENV !== 'production')
          console.error(`Error with endpoint ${endpoint}:`, error)
      }
    }

    if (process.env.NODE_ENV !== 'production')
      console.log('Direct file API response status:', response?.status)

    if (!response || !response.ok) {
      // Reduce error logging for file-preview 404s to avoid console noise
      if (process.env.NODE_ENV !== 'production')
        console.debug('File not found:', { fileId, lastError })

      return NextResponse.json(
        { error: 'File not found', details: 'File may have been deleted or is not accessible' },
        { status: 404 },
      )
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const imageBuffer = await response.arrayBuffer()

    if (process.env.NODE_ENV !== 'production') {
      console.log('Successfully fetched file directly:', {
        contentType,
        size: imageBuffer.byteLength,
      })
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
  catch (error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('Error fetching file directly:', error)

    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}
