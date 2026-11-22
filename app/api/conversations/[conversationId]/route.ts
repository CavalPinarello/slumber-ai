import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { API_KEY, API_URL } from '@/config'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } },
) {
  try {
    const { conversationId } = params
    const body = await request.json().catch(() => ({}))
    const userId = body.userId || 'webapp-user'

    console.log('DELETE request received for conversation:', conversationId)
    console.log('API_URL:', API_URL)
    console.log('API_KEY available:', !!API_KEY)
    console.log('User ID for deletion:', userId)

    // First, verify the conversation exists by trying to fetch it
    try {
      const checkUrl = `${API_URL}/conversations/${conversationId}`
      console.log('🔍 Checking if conversation exists:', checkUrl)

      const checkResponse = await fetch(checkUrl, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('🔍 Conversation existence check status:', checkResponse.status)

      if (checkResponse.ok) {
        const conversationData = await checkResponse.json()
        console.log('🔍 Conversation exists and data:', conversationData)
      }
      else {
        console.log('🔍 Conversation does not exist or access denied')
      }
    }
    catch (error) {
      console.log('🔍 Error checking conversation existence:', error)
    }

    if (!conversationId) {
      console.error('Missing conversation ID in request')
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 },
      )
    }

    // Validate conversation ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(conversationId)) {
      console.error('Invalid conversation ID format:', conversationId)
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 },
      )
    }

    // Use the correct Dify API endpoint for conversation deletion
    const possibleUrls = [
      `${API_URL}/conversations/${conversationId}`, // Standard Dify API endpoint
    ]

    console.log('Trying multiple Dify API endpoints for conversation deletion...')

    let lastError = null
    let response = null

    for (const difyUrl of possibleUrls) {
      try {
        console.log('Trying Dify API URL:', difyUrl)

        response = await fetch(difyUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: userId, // Required by Dify API for conversation deletion
          }),
        })

        console.log(`URL ${difyUrl} response status:`, response.status)

        if (response.ok) {
          console.log('Successfully deleted with URL:', difyUrl)
          break
        }
        else {
          const errorText = await response.text().catch(() => 'Unknown error')
          console.log(`URL ${difyUrl} failed:`, response.status, errorText)
          lastError = { url: difyUrl, status: response.status, error: errorText }
        }
      }
      catch (fetchError) {
        console.error(`Error with URL ${difyUrl}:`, fetchError)
        lastError = { url: difyUrl, error: fetchError.message }
      }
    }

    if (!response || !response.ok)
      console.error('All Dify API endpoints failed. Last error:', lastError)
      // Continue with the error handling below using the last response

    if (response) {
      console.log('Final Dify API response status:', response.status)
      console.log('Final Dify API response headers:', Object.fromEntries(response.headers.entries()))
    }

    if (!response || !response.ok) {
      let errorDetails = 'Unknown error'
      let errorData = {}

      if (response) {
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
            errorDetails = JSON.stringify(errorData)
          }
          else {
            errorDetails = await response.text()
          }
        }
        catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorDetails = 'Could not parse error response'
        }
      }
      else {
        errorDetails = 'No response received from any Dify API endpoint'
        errorData = lastError
      }

      console.error('Delete conversation failed:', {
        status: response?.status,
        statusText: response?.statusText,
        errorDetails,
        errorData,
        conversationId,
        lastError,
      })

      // Return specific error messages based on status
      const statusCode = response?.status || 500

      if (statusCode === 404) {
        // If conversation not found, treat as successful deletion
        console.log('Conversation not found (404), treating as already deleted:', conversationId)
        return NextResponse.json({
          success: true,
          message: 'Conversation already deleted or not found',
          conversationId,
        })
      }

      if (statusCode === 400) {
        return NextResponse.json(
          { error: 'Bad request to Dify API', details: errorDetails, data: errorData },
          { status: 400 },
        )
      }

      return NextResponse.json(
        { error: 'Failed to delete conversation', details: errorDetails, status: statusCode },
        { status: statusCode },
      )
    }

    // Check if response has content
    const contentType = response.headers.get('content-type')
    let responseData = { success: true }

    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json()
      }
      catch (jsonError) {
        console.warn('Failed to parse JSON response, using default success response')
        responseData = { success: true }
      }
    }

    console.log('✅ Conversation deleted successfully from Dify API:', {
      conversationId,
      responseStatus: response.status,
      responseData,
      timestamp: new Date().toISOString(),
      responseHeaders: Object.fromEntries(response.headers.entries()),
    })

    // Verify deletion by attempting to fetch the conversation
    try {
      const verifyUrl = `${API_URL}/conversations/${conversationId}`
      console.log('🔍 Verifying deletion by fetching conversation:', verifyUrl)

      const verifyResponse = await fetch(verifyUrl, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('🔍 Verification response status:', verifyResponse.status)
      console.log('🔍 Verification response headers:', Object.fromEntries(verifyResponse.headers.entries()))

      if (verifyResponse.status === 404) {
        console.log('✅ Deletion verified: Conversation no longer exists on Dify server')
      }
      else if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json().catch(() => null)
        console.warn('⚠️ CRITICAL PERSISTENCE ISSUE: Conversation still exists on Dify server after deletion!')
        console.warn('⚠️ This means the DELETE request did not actually delete the conversation.')
        console.warn('⚠️ Verify data:', verifyData)
      }
      else {
        const errorText = await verifyResponse.text().catch(() => 'Unknown error')
        console.log('🔍 Verification failed with status:', verifyResponse.status, 'Error:', errorText)
      }
    }
    catch (verifyError) {
      console.error('🔍 Verification check failed (network error):', verifyError)
    }

    return NextResponse.json({
      ...responseData,
      success: true,
      conversationId,
      deletedAt: new Date().toISOString(),
    })
  }
  catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
