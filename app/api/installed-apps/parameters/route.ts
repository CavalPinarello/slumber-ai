import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  
  try {
    // Try to fetch from the Dify client first
    const { data } = await client.getApplicationParameters(user)
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  }
  catch (error: any) {
    console.error('Error fetching parameters:', error)
    // Return default parameters if external API fails
    const defaultParameters = {
      opening_statement: '',
      suggested_questions: [],
      suggested_questions_after_answer: {
        enabled: false,
        values: []
      },
      speech_to_text: {
        enabled: false
      },
      text_to_speech: {
        enabled: false
      },
      more_like_this: {
        enabled: false
      },
      user_input_form: []
    }
    return NextResponse.json(defaultParameters, {
      headers: setSession(sessionId),
    })
  }
}