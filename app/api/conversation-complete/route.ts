import { NextRequest, NextResponse } from 'next/server'
import { getInfo } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

// Configuration
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:8000'
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-here'
const ENABLE_EMAIL_NOTIFICATIONS = process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false'

interface PatientInfo {
  name: string
  email: string
  phone: string
  age: number
  profession: string
  surgeryType: string
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface SurveyResponse {
  questionId: string
  questionText: string
  response: string
  responseType: 'scale' | 'text'
}

interface ConversationCompleteRequest {
  conversationId: string
  sessionId: string
  persona: 'BUDDY_DOCTOR' | 'PROFESSIONAL_DOCTOR'
  patientInfo: PatientInfo
  messages: ConversationMessage[]
  surveyResponses: SurveyResponse[]
  pdfGenerated: boolean
  completionTimestamp: string
  durationMinutes?: number
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Conversation complete endpoint called')
    
    if (!ENABLE_EMAIL_NOTIFICATIONS) {
      console.log('⚠️ Email notifications are disabled')
      return NextResponse.json({
        status: 'skipped',
        message: 'Email notifications are disabled'
      })
    }

    const body: ConversationCompleteRequest = await request.json()
    
    console.log('📦 Processing conversation completion for:', {
      conversationId: body.conversationId,
      patientName: body.patientInfo.name,
      surgeryType: body.patientInfo.surgeryType,
      persona: body.persona,
      messageCount: body.messages.length,
      surveyResponseCount: body.surveyResponses.length
    })

    // Validate required fields
    if (!body.conversationId || !body.patientInfo || !body.messages) {
      console.error('❌ Missing required fields in request')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if this is a survey completion (has survey responses)
    const isSurveyComplete = body.surveyResponses && body.surveyResponses.length > 0
    
    // Check if Q13 (the last question) has been answered
    const hasCompletedSurvey = body.surveyResponses?.some(
      response => response.questionId === 'Q13' && response.response
    )

    if (!hasCompletedSurvey) {
      console.log('⏳ Survey not yet complete (Q13 not answered)')
      return NextResponse.json({
        status: 'pending',
        message: 'Waiting for survey completion'
      })
    }

    // Prepare the webhook payload
    const webhookPayload = {
      eventType: 'survey_completed',
      data: {
        conversationId: body.conversationId,
        sessionId: body.sessionId,
        persona: body.persona,
        patientInfo: body.patientInfo,
        messages: body.messages,
        surveyResponses: body.surveyResponses,
        pdfGenerated: body.pdfGenerated,
        completionTimestamp: body.completionTimestamp || new Date().toISOString(),
        durationMinutes: body.durationMinutes || 
          (body.messages.length * 0.5) // Estimate if not provided
      }
    }

    console.log('📤 Sending webhook to email service:', EMAIL_SERVICE_URL)
    
    // Send to email service webhook
    const response = await fetch(`${EMAIL_SERVICE_URL}/webhook/email-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': WEBHOOK_SECRET
      },
      body: JSON.stringify(webhookPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Email service error:', errorText)
      throw new Error(`Email service returned ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Email notification sent successfully:', result)

    return NextResponse.json({
      status: 'success',
      message: 'Conversation data sent to email service',
      emailServiceResponse: result
    })

  } catch (error) {
    console.error('❌ Error in conversation-complete endpoint:', error)
    
    // Don't fail the main flow if email sending fails
    return NextResponse.json({
      status: 'error',
      message: 'Failed to send email notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 }) // Return 200 to not break the main flow
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    emailNotificationsEnabled: ENABLE_EMAIL_NOTIFICATIONS,
    emailServiceUrl: EMAIL_SERVICE_URL
  })
}
