import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  try {
    const { data }: any = await client.getConversations(user)
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  }
  catch (error: any) {
    console.error('Error fetching conversations:', error)
    // Return empty conversations list with proper structure
    const defaultConversations = {
      data: [],
      has_more: false,
      limit: 20,
      page: 1,
      total: 0,
      first_id: null,
      last_id: null,
    }
    return NextResponse.json(defaultConversations, {
      headers: setSession(sessionId),
    })
  }
}
