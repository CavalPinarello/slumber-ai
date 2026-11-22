import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  try {
    // Try to fetch from the Dify client first
    const { data } = await client.getApplicationMeta(user)
    return NextResponse.json(data as object, {
      headers: setSession(sessionId),
    })
  }
  catch (error) {
    // Return default meta data if external API fails
    const defaultMeta = {
      tool_icons: {},
      user_input_form: [],
      max_file_size: 50000000,
      supported_file_types: [
        'txt', 'md', 'pdf', 'html', 'htm', 'docx',
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
        'mp3', 'wav', 'flac', 'aac', 'ogg',
        'mp4', 'mov', 'avi', 'mkv', 'flv',
      ],
    }
    return NextResponse.json(defaultMeta, {
      headers: setSession(sessionId),
    })
  }
}