import { useMutation, useQuery } from '@tanstack/react-query'
import { get, post } from './base'
import type {
  FileUploadConfigResponse,
  StructuredOutputRulesRequestBody,
  StructuredOutputRulesResponse,
} from '@/models/common'
import { createAppQueryConfig, createMutationConfig, QUERY_KEYS } from './query-config'

export const useFileUploadConfig = () => {
  return useQuery(
    createAppQueryConfig(
      ['common', 'file-upload-config'],
      () => get<FileUploadConfigResponse>('/files/upload'),
      'static' // File upload config is relatively static
    )
  )
}

export const useGenerateStructuredOutputRules = () => {
  return useMutation(
    createMutationConfig<StructuredOutputRulesResponse, Error, StructuredOutputRulesRequestBody, unknown>(
      (body: StructuredOutputRulesRequestBody) => {
        return post<StructuredOutputRulesResponse>(
          '/rule-structured-output-generate',
          { body }
        )
      }
    },
  })
}
