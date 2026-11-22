import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } },
) {
  try {
    const { messageId } = params
    const { user } = getInfo(request)

    // Call Dify API to get suggested questions
    const response = await client.sendRequest(
      'GET',
      `/messages/${messageId}/suggested-questions`,
      null,
      { user },
    )

    return NextResponse.json(response)
  }
  catch (error) {
    console.error('Error fetching suggested questions:', error)

    // If the API doesn't support suggested questions or returns an error,
    // return empty array to prevent frontend errors
    return NextResponse.json({
      data: [],
    })
  }
}
