import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { appId: string; conversationId: string } }
) {
  try {
    const { sessionId, user } = getInfo(request)
    const body = await request.json()
    const { auto } = body

    console.log(`POST /api/installed-apps/${params.appId}/conversations/${params.conversationId}/name`)
    console.log('Request body:', { auto })

    if (auto) {
      // Generate automatic conversation name
      const { data } = await client.createConversationName(params.conversationId, user)
      return NextResponse.json(data, {
        headers: setSession(sessionId),
      })
    }
    else {
      // Manual name setting - not implemented yet, return current name
      return NextResponse.json({ name: 'Conversation' }, {
        headers: setSession(sessionId),
      })
    }
  }
  catch (error: any) {
    console.error('Error in conversation naming:', error)
    // Return a default name if the API call fails
    return NextResponse.json({ name: 'Conversation' }, {
      status: 200,
      headers: setSession(getInfo(request).sessionId),
    })
  }
}