import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { appId: string; messageId: string } }
) {
  try {
    const { sessionId, user } = getInfo(request)
    
    console.log(`POST /api/installed-apps/${params.appId}/chat-messages/${params.messageId}/stop`)

    // Stop the chat message generation
    const { data } = await client.stopChatMessage(params.messageId, user)
    
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  }
  catch (error: any) {
    console.error('Error stopping chat message:', error)
    
    // Return success even if stop fails - the message might have already completed
    return NextResponse.json({ result: 'success' }, {
      status: 200,
      headers: setSession(getInfo(request).sessionId),
    })
  }
}