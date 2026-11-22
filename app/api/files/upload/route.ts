import type { NextRequest } from 'next/server'
import axios from 'axios'
import { getInfo } from '@/app/api/utils/common'
import { API_KEY, API_URL } from '@/config'

export const dynamic = 'force-dynamic'

// Custom upload function to avoid Content-Type header issues
async function uploadFileToDify(formData: FormData, _user: string) {
  const url = `${API_URL}/files/upload`

  console.log('Axios request config:', {
    url,
    method: 'POST',
    hasFormData: !!formData,
    formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
      key,
      value: (value && typeof value === 'object' && 'name' in value) ? `File: ${value.name}` : value,
    })),
    authHeader: `Bearer ${API_KEY ? `***${API_KEY.slice(-4)}` : 'missing'}`,
  })

  return await axios({
    method: 'POST',
    url,
    data: formData,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      // Don't set Content-Type for FormData - let axios handle it automatically
    },
    timeout: 30000, // 30 second timeout
    validateStatus: (status) => {
      // Log all responses for debugging
      console.log('Response status:', status)
      return status < 500 // Resolve only if the status code is less than 500
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 File upload endpoint called')

    // Check if required environment variables are set
    if (!API_KEY || API_KEY === 'undefined') {
      console.error('Missing NEXT_PUBLIC_APP_KEY environment variable')
      return new Response(JSON.stringify({
        error: 'Configuration Error',
        message: 'The application is not properly configured. Please set NEXT_PUBLIC_APP_KEY in your environment variables.',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!API_URL || API_URL === 'undefined') {
      console.error('Missing NEXT_PUBLIC_API_URL environment variable')
      return new Response(JSON.stringify({
        error: 'Configuration Error',
        message: 'The application is not properly configured. Please set NEXT_PUBLIC_API_URL in your environment variables.',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const formData = await request.formData()
    const { user } = getInfo(request)

    console.log('File upload request - user:', user)
    // Don't use instanceof File in Node.js environment - check for file-like properties instead
    console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) => [key,
      (value && typeof value === 'object' && 'name' in value && 'size' in value)
        ? `File: ${value.name} (${value.size} bytes)`
        : value,
    ]))

    // Validate that we have a file
    const file = formData.get('file')
    // Check for file-like properties instead of using instanceof
    if (!file || typeof file === 'string' || !('name' in file) || !('size' in file)) {
      console.error('No file found in upload request')
      return new Response(JSON.stringify({
        error: 'No file provided',
        details: 'A file must be included in the upload request',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File too large: ${file.size} bytes`)
      return new Response(JSON.stringify({
        error: 'File too large',
        details: `File size ${file.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Ensure user parameter is included
    if (!formData.has('user'))
      formData.append('user', user)

    console.log('📤 Uploading file to Dify:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      user,
      apiUrl: API_URL,
      hasApiKey: !!API_KEY,
      uploadUrl: `${API_URL}/files/upload`,
    })

    // Use a custom upload function to avoid Content-Type header issues
    let res
    try {
      res = await uploadFileToDify(formData, user)
      console.log('Dify file upload response status:', res.status)
      console.log('Dify file upload response data:', res.data)
    }
    catch (uploadError: any) {
      console.error('Upload function error:', uploadError)
      if (uploadError.response) {
        console.error('Upload error response:', {
          status: uploadError.response.status,
          statusText: uploadError.response.statusText,
          data: uploadError.response.data,
        })
      }
      throw uploadError
    }

    // Ensure the response includes required fields for frontend
    const responseData = {
      ...res.data,
      // Ensure uploadedId is available for backward compatibility
      uploadedId: res.data?.id || res.data?.upload_file_id || res.data?.uploadedId,
      id: res.data?.id || res.data?.upload_file_id || res.data?.uploadedId,
      upload_file_id: res.data?.id || res.data?.upload_file_id || res.data?.uploadedId,
    }

    return new Response(JSON.stringify(responseData), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
  catch (e: any) {
    console.error('File upload error:', e)
    console.error('Error type:', e.name)
    console.error('Error message:', e.message)
    console.error('Error code:', e.code)

    // Check if it's a network error
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === 'ETIMEDOUT') {
      console.error('Network error - cannot reach API at:', API_URL)
      return new Response(JSON.stringify({
        error: 'Network Error',
        message: `Cannot connect to the Dify API at ${API_URL}. Please check your network connection and API URL configuration.`,
        details: {
          apiUrl: API_URL,
          errorCode: e.code,
        },
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.error('Error details:', e.response?.data || e.message)

    // Enhanced error logging for debugging
    if (e.response) {
      console.error('Dify API file upload error response:', {
        status: e.response.status,
        statusText: e.response.statusText,
        data: e.response.data,
        url: e.response.config?.url,
        headers: e.response.headers,
        config: {
          method: e.response.config?.method,
          headers: e.response.config?.headers,
        },
      })

      // Log specific validation errors
      if (e.response.data?.code === 'invalid_param'
          || e.response.data?.message?.includes('validation')
          || e.response.data?.message?.includes('AI service')) {
        console.error('FILE VALIDATION ERROR:', {
          message: e.response.data.message,
          code: e.response.data.code,
          details: e.response.data.details,
          fileInfo: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          },
        })
      }
    }

    // Determine appropriate status code
    const status = e.response?.status || 500
    let errorMessage = e.response?.data?.message || e.message || 'File upload failed'

    // Provide more specific error messages for common validation errors
    if (errorMessage.includes('failed validation at the AI service level'))
      errorMessage = 'File validation failed: The file type or format is not supported by the AI service. Please ensure you are uploading a supported file type (PDF, TXT, DOC, DOCX, MD, HTML, XLSX, XLS, CSV, JSON, XML, etc.).'
    else if (errorMessage.includes('file type'))
      errorMessage = 'Invalid file type: Please upload a supported file format.'
    else if (errorMessage.includes('file size'))
      errorMessage = `File size error: ${errorMessage}. Maximum file size is 10MB.`

    return new Response(JSON.stringify({
      error: errorMessage,
      details: e.response?.data || null,
      status,
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
