import type { NextRequest } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Chat API endpoint called')
    const body = await request.json()
    console.log('📦 Request body parsed successfully:', Object.keys(body))

    // Import sanitization utility dynamically to avoid ESLint issues
    const fileUploaderUtils = await import('@/app/components/base/file-uploader/utils')
    const { sanitizeFileForAPI } = fileUploaderUtils

    const {
      inputs,
      query,
      files,
      conversation_id: conversationId,
      response_mode: responseMode,
    } = body

    console.log('📨 Raw request body keys:', Object.keys(body))
    console.log('📨 Full request body:', JSON.stringify(body, null, 2))
    console.log('Chat API Request:', {
      inputs,
      query,
      conversationId,
      responseMode,
      files,
      user: getInfo(request).user,
      userType: typeof getInfo(request).user,
    })

    const { user } = getInfo(request)

    // Extract files from inputs and format them for Dify API
    let formattedFiles = []

    // Check for files in the files array
    if (files && Array.isArray(files)) {
      formattedFiles = files.filter(file => file && (file.uploadedId || file.upload_file_id || file.id)).map((file) => {
        // Log the raw file object to understand its structure
        console.log('Processing file from files array:', {
          uploadedId: file.uploadedId,
          upload_file_id: file.upload_file_id,
          id: file.id,
          name: file.name,
          type: file.type,
          mime_type: file.mime_type,
          originalMimeType: file.originalFile?.type,
        })

        // Determine the proper type based on file extension or MIME type
        const mimeType = file.type || file.mime_type || file.originalFile?.type || ''
        let fileType = 'document' // default

        // Enhanced file type detection with better validation
        if (mimeType) {
          if (mimeType.startsWith('image/'))
            fileType = 'image'
          else if (mimeType.startsWith('audio/'))
            fileType = 'audio'
          else if (mimeType.startsWith('video/'))
            fileType = 'video'
          else if (mimeType === 'application/pdf' || mimeType.includes('pdf'))
            fileType = 'document'
          else if (mimeType.includes('text/') || mimeType.includes('application/json')
                   || mimeType.includes('application/xml') || mimeType.includes('application/msword')
                   || mimeType.includes('application/vnd.openxmlformats') || mimeType.includes('spreadsheet')
                   || mimeType === 'application/octet-stream') // Handle generic binary files
            fileType = 'document'
          else
            fileType = 'document'
        }

        // Override if file already has a supportFileType that should map to a specific type
        if (file.supportFileType) {
          // Map supportFileType to Dify-accepted types
          const typeMapping: Record<string, string> = {
            image: 'image',
            audio: 'audio',
            video: 'video',
            document: 'document',
            custom: 'document', // Map 'custom' to 'document' for Dify API compatibility
          }

          fileType = typeMapping[file.supportFileType] || 'document'

          console.log(`File type mapping: supportFileType='${file.supportFileType}' -> fileType='${fileType}'`)
        }

        // Try multiple possible properties for the upload file ID
        const uploadFileId = file.uploadedId || file.upload_file_id || file.id

        // Validate that we have a valid upload file ID
        if (!uploadFileId) {
          console.error('File missing upload ID:', {
            fileName: file.name,
            fileType: file.type,
            supportFileType: file.supportFileType,
            availableIds: {
              uploadedId: file.uploadedId,
              upload_file_id: file.upload_file_id,
              id: file.id,
            },
          })
          // Skip files without valid IDs
          return null
        }

        console.log(`Mapping file ${file.name} to type: ${fileType}, upload_file_id: ${uploadFileId}`)

        const formattedFile = {
          type: fileType,
          transfer_method: 'local_file', // Always use local_file for uploaded files
          upload_file_id: uploadFileId,
        }

        // Only include URL if it exists and transfer method is remote_url
        if (file.url && file.transfer_method === 'remote_url') {
          formattedFile.transfer_method = 'remote_url'
          formattedFile.url = file.url
        }

        return formattedFile
      }).filter(file => file !== null) // Remove null entries from files without valid IDs
    }

    // Process inputs but keep the Documents field as the app requires it
    const cleanedInputs = { ...inputs }

    // If there's a Documents field in inputs, process it but keep it for the app
    if (inputs && inputs.Documents && Array.isArray(inputs.Documents)) {
      inputs.Documents.forEach((item) => {
        if (item && typeof item === 'object' && (item.upload_file_id || item.uploadedId || item.id)) {
          // Log the raw file object to understand its structure
          console.log('Processing file from inputs.Documents:', {
            uploadedId: item.uploadedId,
            upload_file_id: item.upload_file_id,
            id: item.id,
            name: item.name,
            type: item.type,
            mime_type: item.mime_type,
            originalMimeType: item.originalFile?.type,
          })

          // Determine the proper type based on file extension or MIME type
          const mimeType = item.type || item.mime_type || item.originalFile?.type || ''
          let fileType = 'document' // default

          // Enhanced file type detection with better validation
          if (mimeType) {
            if (mimeType.startsWith('image/'))
              fileType = 'image'
            else if (mimeType.startsWith('audio/'))
              fileType = 'audio'
            else if (mimeType.startsWith('video/'))
              fileType = 'video'
            else if (mimeType === 'application/pdf' || mimeType.includes('pdf'))
              fileType = 'document'
            else if (mimeType.includes('text/') || mimeType.includes('application/json')
                     || mimeType.includes('application/xml') || mimeType.includes('application/msword')
                     || mimeType.includes('application/vnd.openxmlformats') || mimeType.includes('spreadsheet')
                     || mimeType === 'application/octet-stream') // Handle generic binary files
              fileType = 'document'
            else
              fileType = 'document'
          }

          // Override if item already has a supportFileType that should map to a specific type
          if (item.supportFileType) {
            // Map supportFileType to Dify-accepted types
            const typeMapping: Record<string, string> = {
              image: 'image',
              audio: 'audio',
              video: 'video',
              document: 'document',
              custom: 'document', // Map 'custom' to 'document' for Dify API compatibility
            }

            fileType = typeMapping[item.supportFileType] || 'document'

            console.log(`Documents file type mapping: supportFileType='${item.supportFileType}' -> fileType='${fileType}'`)
          }

          // Try multiple possible properties for the upload file ID
          const uploadFileId = item.upload_file_id || item.uploadedId || item.id

          // Validate that we have a valid upload file ID
          if (!uploadFileId) {
            console.error('Documents file missing upload ID:', {
              fileName: item.name,
              fileType: item.type,
              supportFileType: item.supportFileType,
              availableIds: {
                uploadedId: item.uploadedId,
                upload_file_id: item.upload_file_id,
                id: item.id,
              },
            })
            // Skip files without valid IDs
            return
          }

          console.log(`Mapping Documents file ${item.name} to type: ${fileType}, upload_file_id: ${uploadFileId}`)

          // For Documents field, use a simpler structure that matches Dify Studio
          const formattedFile = {
            type: fileType,
            transfer_method: 'local_file',
            upload_file_id: uploadFileId,
          }

          // Only include URL if it exists and transfer method is remote_url
          if (item.url && item.url !== '' && item.transfer_method === 'remote_url') {
            formattedFile.transfer_method = 'remote_url'
            formattedFile.url = item.url
            delete formattedFile.upload_file_id // Remote files don't use upload_file_id
          }
          else {
            // For local files, ensure we don't include empty URL field
            delete formattedFile.url
          }

          // Remove empty/undefined fields that might cause validation issues
          Object.keys(formattedFile).forEach((key) => {
            if (formattedFile[key] === undefined || formattedFile[key] === '' || formattedFile[key] === null)
              delete formattedFile[key]
          })

          formattedFiles.push(formattedFile)
        }
      })
    }

    // Keep the Documents field in inputs as the Dify app requires it
    // But remove it from files array to avoid duplication - send files ONLY in inputs.Documents

    console.log('Formatted files for Dify (before deduplication):', JSON.stringify(formattedFiles, null, 2))

    // Sanitize all files before sending to API and filter out invalid files
    formattedFiles = formattedFiles.map(file => sanitizeFileForAPI(file)).filter(file => file !== null)
    console.log('Sanitized files for Dify:', JSON.stringify(formattedFiles, null, 2))

    // Keep Documents field as the app requires it, but don't duplicate in files array
    // The app specifically requires Documents field in inputs
    if (cleanedInputs.Documents && Array.isArray(cleanedInputs.Documents) && cleanedInputs.Documents.length > 0) {
      console.log('📋 Files are in inputs.Documents - keeping Documents field as app requires it')

      // Fix the type mapping in the Documents field directly
      cleanedInputs.Documents = cleanedInputs.Documents.map((doc) => {
        if (doc && doc.upload_file_id) {
          const cleanedDoc = sanitizeFileForAPI({
            type: doc.type === 'custom' ? 'document' : (doc.type || 'document'),
            transfer_method: doc.transfer_method || 'local_file',
            upload_file_id: doc.upload_file_id,
            url: doc.url,
          })

          // sanitizeFileForAPI might return null for invalid files
          if (cleanedDoc === null) {
            console.error('Invalid document in Documents field:', doc)
            return null
          }

          // Remove empty/undefined fields
          Object.keys(cleanedDoc).forEach((key) => {
            if (cleanedDoc[key] === undefined || cleanedDoc[key] === '' || cleanedDoc[key] === null)
              delete cleanedDoc[key]
          })

          return cleanedDoc
        }
        return doc
      }).filter(doc => doc !== null) // Remove invalid documents

      // Clear the separate files array to avoid duplication
      formattedFiles = []
      console.log('📋 Cleaned Documents field and cleared separate files array')
    }
    console.log('Inputs with Documents field preserved:', cleanedInputs)

    // Additional validation for files - filter out invalid files
    const validFiles = []
    formattedFiles.forEach((file, index) => {
      console.log(`File ${index}:`, {
        type: file.type,
        transfer_method: file.transfer_method,
        upload_file_id: file.upload_file_id,
        hasUrl: !!file.url,
      })

      // Validate required fields and filter out invalid files
      if (!file.upload_file_id || file.upload_file_id === 'undefined' || file.upload_file_id === 'null') {
        console.error(`❌ File ${index} has invalid upload_file_id: ${file.upload_file_id} - EXCLUDING from request`)
        return // Skip this file
      }

      if (!['image', 'document', 'audio', 'video', 'custom'].includes(file.type)) {
        console.error(`❌ File ${index} has invalid type: ${file.type} - EXCLUDING from request`)
        return // Skip this file
      }

      console.log(`✅ File ${index} passed validation - including in request`)
      validFiles.push(file)
    })

    // Use only valid files
    formattedFiles = validFiles
    console.log(`📋 Final file count after validation: ${formattedFiles.length} files`)

    // Convert responseMode to boolean for stream parameter
    const isStreaming = responseMode === 'streaming'

    console.log('🔄 Calling Dify client.createChatMessage with params:', {
      inputs: cleanedInputs,
      query,
      user,
      stream: isStreaming,
      conversationId,
      filesCount: formattedFiles.length,
      files: formattedFiles, // Log the actual files being sent
    })

    // Log the exact data structure that will be sent to Dify
    const difyRequestData = {
      inputs: cleanedInputs,
      query,
      user,
      response_mode: isStreaming ? 'streaming' : 'blocking',
      files: formattedFiles,
    }
    if (conversationId)
      difyRequestData.conversation_id = conversationId

    console.log('🔍 Exact data being sent to Dify API:', JSON.stringify(difyRequestData, null, 2))

    // Log the Documents field structure specifically
    if (difyRequestData.inputs?.Documents)
      console.log('📄 Documents field structure:', JSON.stringify(difyRequestData.inputs.Documents, null, 2))

    // Log files array structure
    if (difyRequestData.files && difyRequestData.files.length > 0)
      console.log('📄 Files array structure:', JSON.stringify(difyRequestData.files, null, 2))
    else
      console.log('📄 Files array is empty - using Documents field only')

    // Log files information
    console.log('📄 Files array contains:', formattedFiles.length, 'files')
    console.log('📄 Inputs structure:', Object.keys(cleanedInputs))

    // Validate that we're not sending an empty files array if no valid files exist
    if (formattedFiles.length === 0) {
      console.log('⚠️ No valid files to send - removing files field from request')
      delete difyRequestData.files
    }

    // Validate required fields before sending to Dify
    if (!query || typeof query !== 'string')
      throw new Error('Query is required and must be a string')

    if (!user || typeof user !== 'string')
      throw new Error('User is required and must be a string')

    console.log('✅ Validation passed, calling Dify client...')

    // Log the actual parameters being passed to the client
    console.log('📋 Parameters being passed to Dify client.createChatMessage:', {
      cleanedInputs: JSON.stringify(cleanedInputs),
      query,
      user,
      isStreaming,
      conversationId,
      formattedFiles: JSON.stringify(formattedFiles),
    })

    const res = await client.createChatMessage(cleanedInputs, query, user, isStreaming, conversationId, formattedFiles.length > 0 ? formattedFiles : null)
    console.log('✅ Dify client response received successfully')
    console.log('📊 Response type analysis:', {
      resType: typeof res,
      hasData: !!res.data,
      dataType: res.data ? typeof res.data : 'no data',
      isReadableStream: res.data instanceof ReadableStream,
      isResponse: res.data instanceof Response,
      hasBody: !!(res.data && res.data.body),
      bodyIsStream: res.data && res.data.body instanceof ReadableStream,
      resIsStream: res instanceof ReadableStream,
      isNodeStream: res.data && typeof res.data === 'object' && 'pipe' in res.data,
      isAxiosResponse: res.data && res.data.constructor && res.data.constructor.name === 'IncomingMessage',
    })

    // For streaming responses, return the response directly
    if (isStreaming) {
      // Check if res.data is a Node.js stream (from Axios)
      if (res.data && typeof res.data === 'object' && 'pipe' in res.data && 'on' in res.data) {
        console.log('📡 Converting Node.js stream from Axios to ReadableStream for SSE')
        
        // Create a ReadableStream from the Node.js stream
        const readableStream = new ReadableStream({
          start(controller) {
            res.data.on('data', (chunk) => {
              controller.enqueue(new TextEncoder().encode(chunk.toString()))
            })
            
            res.data.on('end', () => {
              controller.close()
            })
            
            res.data.on('error', (error) => {
              console.error('❌ Stream error:', error)
              controller.error(error)
            })
          }
        })
        
        return new Response(readableStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }
      // Check if res.data is already a ReadableStream
      else if (res.data instanceof ReadableStream) {
        return new Response(res.data, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }
      // If res.data is the raw response object, use its body
      else if (res.data && res.data.body instanceof ReadableStream) {
        return new Response(res.data.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }
      // If res itself has the stream
      else if (res instanceof ReadableStream) {
        return new Response(res, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }
      // Fallback: res.data might be the complete response data
      else {
        console.warn('⚠️ Streaming response not detected, res.data type:', typeof res.data)
        return new Response(res.data, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }
    }

    // For non-streaming responses, return JSON
    return new Response(JSON.stringify(res.data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
  catch (error) {
    // Safe error logging to avoid circular reference issues
    try {
      console.error('Chat API Error:', error instanceof Error ? error.message : 'Unknown error')
    }
    catch (logError) {
      console.error('Chat API Error: [Error object contains circular references]')
    }

    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }

    // Check if it's a Dify API error with response details
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as any

      // Safely extract response data without circular references
      let responseData = null
      try {
        if (apiError.response?.data) {
          console.log('Raw Dify API error response data type:', typeof apiError.response.data)

          // Check if response data is a stream (IncomingMessage) that needs to be read
          if (apiError.response.data && typeof apiError.response.data === 'object'
              && 'statusCode' in apiError.response.data && 'rawHeaders' in apiError.response.data) {
            // This is likely an IncomingMessage stream, try to read buffered data
            const stream = apiError.response.data as any
            let errorBody = ''

            try {
              // Try to read from the buffer if available
              if (stream._readableState && stream._readableState.buffer) {
                const buffers = stream._readableState.buffer
                if (buffers.length > 0) {
                  for (const chunk of buffers)
                    errorBody += chunk.toString()
                }
              }

              // If we got error body, try to parse it as JSON
              if (errorBody) {
                console.log('Raw error body from stream:', errorBody)
                try {
                  const parsedError = JSON.parse(errorBody)
                  responseData = {
                    message: parsedError.message || parsedError.error || 'Unknown error',
                    error: parsedError.error,
                    code: parsedError.code,
                    status: parsedError.status,
                    detail: parsedError.detail,
                    errors: parsedError.errors,
                  }
                }
                catch (parseError) {
                  console.warn('Could not parse error body as JSON:', parseError)
                  responseData = { message: errorBody }
                }
              }
              else {
                // Fallback: construct error from available stream properties
                responseData = {
                  message: `HTTP ${stream.statusCode}: ${stream.statusMessage || 'Bad Request'}`,
                  status: stream.statusCode,
                  statusText: stream.statusMessage,
                }
              }
            }
            catch (streamError) {
              console.warn('Could not read error from stream:', streamError)
              responseData = {
                message: `HTTP ${stream.statusCode}: ${stream.statusMessage || 'Bad Request'}`,
              }
            }
          }
          else {
            // Normal object response data
            responseData = {
              message: apiError.response.data.message || apiError.response.data.error,
              error: apiError.response.data.error,
              code: apiError.response.data.code,
              status: apiError.response.data.status,
              detail: apiError.response.data.detail,
              errors: apiError.response.data.errors,
            }
          }
        }
      }
      catch (serializationError) {
        console.warn('Could not serialize response data:', serializationError)
        responseData = { message: 'Response data contains circular references' }
      }

      console.error('Dify API Error Response:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: responseData,
        url: apiError.response?.config?.url,
      })

      // Check for specific file validation errors
      const isFileValidationError = responseData?.message && (
        responseData.message.includes('File validation failed')
        || responseData.message.includes('validation failed for file')
        || responseData.message.includes('failed validation at the AI service level')
        || responseData.message.includes('file type')
        || responseData.message.includes('unsupported file')
      )

      if (isFileValidationError) {
        console.error('🚨 File validation error detected:', responseData)

        // Extract filename from error message or request data
        let fileName = 'unknown file'
        let fileType = 'unknown'

        // Try to extract filename from error message
        const errorMessageMatch = responseData?.message?.match(/['"](.*?)['"]/g)
        if (errorMessageMatch && errorMessageMatch.length > 0)
          fileName = errorMessageMatch[0].replace(/['"]/g, '')

        // Get file info from the request
        if (formattedFiles.length > 0) {
          // Log which file(s) failed
          console.log('Files that were sent when error occurred:', formattedFiles)
        }

        // Check file type from request data
        const fileExtMatch = fileName.match(/\.([^.]+)$/)
        if (fileExtMatch)
          fileType = fileExtMatch[1].toLowerCase()

        let suggestion = 'Please try one of the following:'
        let troubleshooting = []

        // Provide specific suggestions based on file type
        if (fileType === 'txt' || fileType === 'text') {
          suggestion = 'Text files should normally be supported. The issue might be with the file encoding or content.'
          troubleshooting = [
            'Ensure the file is UTF-8 encoded',
            'Check if the file contains special characters that might cause issues',
            'Try creating a new text file with simple content first',
            'Verify the file is not corrupted',
            'Try uploading a smaller text file (under 1MB) first',
          ]
        }
        else if (fileType === 'pdf') {
          suggestion = 'PDF files can sometimes have compatibility issues with AI services.'
          troubleshooting = [
            'Try converting the PDF to a text file (.txt) or Word document (.docx)',
            'Ensure the PDF is not password-protected or encrypted',
            'If the PDF was converted from another format, try using the original file',
            'Use a PDF reader to "Save as Text" and upload the text file instead',
            'Try a different PDF file to test if the issue is file-specific',
          ]
        }
        else if (['doc', 'docx'].includes(fileType)) {
          suggestion = 'Word documents should be supported. The issue might be with the file content or format.'
          troubleshooting = [
            'Try saving the document as a .txt file',
            'Remove any embedded images or complex formatting',
            'Check if the document contains macros or is protected',
            'Try creating a simple test document first',
          ]
        }
        else {
          suggestion = 'The file type might not be supported by the AI service.'
          troubleshooting = [
            'Convert the file to a supported format: TXT, PDF, DOC, DOCX, MD, HTML',
            'Try uploading a simple text file first to test',
            'Check the Dify documentation for supported file types',
            'Ensure the file size is under 10MB',
          ]
        }

        return new Response(JSON.stringify({
          error: 'File Validation Error',
          message: `The file "${fileName}" failed validation at the AI service level. This usually means the file format or content is not supported.`,
          status: apiError.response?.status || 400,
          details: {
            originalError: responseData?.message,
            fileName,
            fileType,
            suggestion,
            troubleshooting,
            supportedFormats: ['TXT', 'PDF', 'DOC', 'DOCX', 'MD', 'HTML', 'XLSX', 'XLS', 'CSV', 'JSON', 'XML'],
          },
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Return more specific error information
      return new Response(JSON.stringify({
        error: 'Dify API Error',
        message: responseData?.message || apiError.message || 'Failed to send message',
        status: apiError.response?.status || 500,
        details: responseData,
      }), {
        status: apiError.response?.status || 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
