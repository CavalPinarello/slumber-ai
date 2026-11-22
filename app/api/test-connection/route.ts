import type { NextRequest } from 'next/server'
import { API_KEY, API_URL, APP_ID } from '@/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Dify API connection...')
    console.log('Config:', {
      API_KEY: API_KEY ? `${API_KEY.substring(0, 8)}...` : 'MISSING',
      API_URL,
      APP_ID,
    })

    // Test basic connection with a simple request
    const testMessage = {
      inputs: {},
      query: 'test',
      user: 'test-user',
      response_mode: 'blocking',
    }

    const response = await fetch(`${API_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    })

    const result = await response.text()

    return new Response(JSON.stringify({
      status: 'success',
      config: {
        API_URL,
        APP_ID,
        API_KEY_EXISTS: !!API_KEY,
      },
      testResponse: {
        status: response.status,
        statusText: response.statusText,
        body: result,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  catch (error) {
    console.error('Connection test failed:', error)
    return new Response(JSON.stringify({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        API_URL,
        APP_ID,
        API_KEY_EXISTS: !!API_KEY,
      },
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
