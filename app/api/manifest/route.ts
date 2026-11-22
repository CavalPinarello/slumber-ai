import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { API_KEY, API_URL } from '@/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Fetch site information from the API
    let siteData: any = null

    try {
      const response = await fetch(`${API_URL}/site`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok)
        siteData = await response.json()
    }
    catch (error) {
      console.error('Error fetching site data for manifest:', error)
    }

    // Default manifest values
    const defaultManifest = {
      name: 'Slumber AI',
      short_name: 'Slumber',
      description: 'AI-powered chat assistant',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#ffffff',
      orientation: 'portrait-primary',
      scope: '/',
      lang: 'ja',
      icons: [
        {
          src: '/favicon.ico',
          sizes: '16x16 32x32',
          type: 'image/x-icon',
        },
        {
          src: '/favicon.ico',
          sizes: '192x192',
          type: 'image/x-icon',
          purpose: 'any',
        },
        {
          src: '/favicon.ico',
          sizes: '512x512',
          type: 'image/x-icon',
          purpose: 'maskable',
        },
      ],
      categories: ['productivity', 'utilities'],
      shortcuts: [],
    }

    // Update manifest with site data if available
    if (siteData) {
      if (siteData.title) {
        defaultManifest.name = `${siteData.title} Chat`
        defaultManifest.short_name = siteData.title
      }

      if (siteData.description)
        defaultManifest.description = siteData.description

      // Use app icon if available
      if (siteData.icon_type === 'image' && siteData.icon_url) {
        defaultManifest.icons = [
          {
            src: siteData.icon_url,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: siteData.icon_url,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/favicon.ico',
            sizes: '16x16 32x32',
            type: 'image/x-icon',
          },
        ]
      }
      else if (siteData.icon && siteData.icon_type === 'emoji') {
        // For emoji icons, we'll use a data URL or fallback to favicon
        defaultManifest.icons = [
          {
            src: '/favicon.ico',
            sizes: '16x16 32x32',
            type: 'image/x-icon',
          },
          {
            src: '/favicon.ico',
            sizes: '192x192',
            type: 'image/x-icon',
            purpose: 'any',
          },
          {
            src: '/favicon.ico',
            sizes: '512x512',
            type: 'image/x-icon',
            purpose: 'maskable',
          },
        ]
      }

      // Set language based on default_language
      if (siteData.default_language)
        defaultManifest.lang = siteData.default_language
    }

    return new NextResponse(JSON.stringify(defaultManifest, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
      },
    })
  }
  catch (error) {
    console.error('Error generating manifest:', error)

    // Return default manifest on error
    const fallbackManifest = {
      name: 'Slumber AI',
      short_name: 'Slumber',
      description: 'AI-powered chat assistant for your daily conversations',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#ffffff',
      orientation: 'portrait-primary',
      scope: '/',
      lang: 'ja',
      icons: [
        {
          src: '/favicon.ico',
          sizes: '16x16 32x32',
          type: 'image/x-icon',
        },
        {
          src: '/favicon.ico',
          sizes: '192x192',
          type: 'image/x-icon',
          purpose: 'any',
        },
        {
          src: '/favicon.ico',
          sizes: '512x512',
          type: 'image/x-icon',
          purpose: 'maskable',
        },
      ],
      categories: ['productivity', 'utilities'],
      shortcuts: [],
    }

    return new NextResponse(JSON.stringify(fallbackManifest, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Shorter cache on error
      },
    })
  }
}
