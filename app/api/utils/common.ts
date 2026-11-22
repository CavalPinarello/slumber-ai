import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { v4 } from 'uuid'
import { API_KEY, API_URL, APP_ID } from '@/config'

const userPrefix = `user_${APP_ID || 'default'}:`

export const getInfo = (request: NextRequest) => {
  const sessionId = request.cookies.get('session_id')?.value || v4()
  const user = userPrefix + sessionId
  return {
    sessionId,
    user,
  }
}

export const setSession = (sessionId: string) => {
  return { 'Set-Cookie': `session_id=${sessionId}` }
}

// Check if configuration is valid
const isConfigValid = API_KEY && API_URL && APP_ID

if (!isConfigValid) {
  console.error('Dify client configuration is missing required environment variables:', {
    API_KEY: API_KEY ? `***${API_KEY.slice(-4)}` : 'MISSING',
    API_URL: API_URL || 'MISSING',
    APP_ID: APP_ID || 'MISSING'
  })
}

// Create client only if configuration is valid, otherwise create a dummy client
export const client = isConfigValid 
  ? new ChatClient(API_KEY, API_URL) 
  : new ChatClient('dummy-key', 'https://api.dify.ai/v1')
