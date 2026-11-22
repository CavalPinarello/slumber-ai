import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { API_KEY, API_URL } from '@/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching app site info from:', `${API_URL}/site`)
    console.log('Using API key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT SET')

    const response = await fetch(`${API_URL}/site`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Site API response status:', response.status)

    if (!response.ok) {
      console.error('Site API error, returning default data')
      // Return default site info when external API fails
      const defaultSiteInfo = {
        title: 'Chat APP',
        description: 'AI-powered chat assistant for your daily conversations',
        icon: '🤖',
        icon_background: '#FFEAD5',
        copyright: '',
        privacy_policy: process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL || '',
        custom_disclaimer: '',
        default_language: 'en',
        chat_color_theme: null,
        chat_color_theme_inverted: false,
        prompt_public: false,
        show_workflow_steps: true,
        use_icon_as_answer_icon: false,
      }
      return NextResponse.json(defaultSiteInfo)
    }

    const data = await response.json()
    console.log('Site API success response:', data)
    console.log('Site API icon data:', {
      icon: data.icon,
      icon_type: data.icon_type,
      icon_url: data.icon_url,
      icon_background: data.icon_background,
    })

    // Always preserve image icon information for proper display
    if (data.icon_type === 'image' && data.icon_url)
      console.log('Image icon detected, preserving icon_url for display:', data.icon_url)
      // Keep the icon_url intact for the frontend to handle

    // Ensure privacy_policy has a fallback value if null or empty
    if (!data.privacy_policy) {
      data.privacy_policy = process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL || ''
      console.log('Added fallback privacy policy URL:', data.privacy_policy)
    }

    return NextResponse.json(data)
  }
  catch (error) {
    console.error('Error fetching app site info:', error)
    // Return default site info on error
    const defaultSiteInfo = {
      title: 'Chat APP',
      description: 'AI-powered chat assistant for your daily conversations',
      icon: '🤖',
      icon_background: '#FFEAD5',
      copyright: '',
      privacy_policy: process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL || '',
      custom_disclaimer: '',
      default_language: 'en',
      chat_color_theme: null,
      chat_color_theme_inverted: false,
      prompt_public: false,
      show_workflow_steps: true,
      use_icon_as_answer_icon: false,
    }
    return NextResponse.json(defaultSiteInfo)
  }
}
