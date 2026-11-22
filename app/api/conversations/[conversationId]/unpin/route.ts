import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getInfo } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: {
  params: { conversationId: string }
}) {
  const { conversationId } = params
  const { user: _user } = getInfo(request)

  console.log('PATCH /api/conversations/[conversationId]/unpin - conversationId:', conversationId)

  try {
    // Pin state is now managed on the client side via localStorage
    // This endpoint just acknowledges the request
    console.log('Unpin conversation API called for:', conversationId)
    return NextResponse.json({ success: true, message: 'Conversation unpinned successfully' })
  }
  catch (error: any) {
    console.error('Error unpinning conversation:', error)
    return NextResponse.json(
      { error: 'Failed to unpin conversation', details: error.message },
      { status: 500 },
    )
  }
}
