import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { appId: string } }) {
  try {
    const { sessionId, user } = getInfo(request)
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      console.error('Missing conversation_id parameter')
      return NextResponse.json(
        { error: 'conversation_id parameter is required' },
        { status: 400, headers: setSession(sessionId) },
      )
    }

    console.log('Fetching messages for conversation:', conversationId)
    const { data }: any = await client.getConversationMessages(user, conversationId as string)
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  }
  catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 },
    )
  }
}