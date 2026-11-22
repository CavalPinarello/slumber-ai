import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: NextRequest, { params }: { params: { appId: string } }) {
  const { sessionId, user } = getInfo(request)
  
  try {
    const { data } = await client.getApplicationParameters(user)
    return NextResponse.json(data as object, {
      headers: {
        ...setSession(sessionId),
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
  catch (error) {
    console.error('Error fetching parameters:', error)
    // Return default parameters structure
    const defaultParams = {
      opening_statement: '',
      suggested_questions: [],
      suggested_questions_after_answer: {
        enabled: false,
      },
      speech_to_text: {
        enabled: false,
      },
      text_to_speech: {
        enabled: false,
        voice: '',
        language: 'en',
      },
      retriever_resource: {
        enabled: false,
      },
      annotation_reply: {
        enabled: false,
      },
      user_input_form: [],
      file_upload: {
        image: {
          enabled: false,
          number_limits: 3,
          detail: 'high',
          transfer_methods: ['local_file', 'remote_url'],
        },
      },
      system_parameters: {
        image_file_size_limit: 50000000,
      },
    }
    return NextResponse.json(defaultParams, {
      headers: setSession(sessionId),
    })
  }
  
  try {
    const { data } = await client.getApplicationParameters(user)
    return NextResponse.json(data as object, {
      headers: setSession(sessionId),
    })
  }
  catch (error) {
    console.error('Error fetching parameters:', error)
    // Return default parameters structure
    const defaultParams = {
      opening_statement: '',
      suggested_questions: [],
      suggested_questions_after_answer: {
        enabled: false,
        icon: '',
      },
      speech_to_text: {
        enabled: false,
      },
      text_to_speech: {
        enabled: false,
        voice: '',
        language: 'en',
      },
      retriever_resource: {
        enabled: false,
      },
      annotation_reply: {
        enabled: false,
      },
      user_input_form: [],
      file_upload: {
        image: {
          enabled: false,
          number_limits: 3,
          detail: 'high',
          transfer_methods: ['local_file', 'remote_url'],
        },
      },
      system_parameters: {
        image_file_size_limit: 50000000,
      },
    }
    return NextResponse.json(defaultParams, {
      headers: {
        ...setSession(sessionId),
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}