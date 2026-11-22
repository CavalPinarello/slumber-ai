import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { appId: string } }) {
  const { sessionId, user } = getInfo(request)
  const searchParams = request.nextUrl.searchParams
  const pinned = searchParams.get('pinned')
  const lastId = searchParams.get('last_id')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  console.log('GET /api/installed-apps/[appId]/conversations - params:', { pinned, lastId, limit })

  try {
    // Get all conversations - filtering will be done on the client side
    const { data }: any = await client.getConversations(user, lastId || undefined, limit)
    console.log('Raw conversations from client:', data)

    // Note: pinned parameter is ignored here since pin state is managed client-side
    // The client will filter the conversations based on localStorage state
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