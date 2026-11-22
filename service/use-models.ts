import { useQuery } from '@tanstack/react-query'
import { get } from './base'
import { QUERY_KEYS, createAppQueryConfig } from './query-config'
import type {
  ModelItem,
} from '@/app/components/header/account-setting/model-provider-page/declarations'

export const useModelProviderModelList = (provider: string) => {
  return useQuery(
    createAppQueryConfig(
      QUERY_KEYS.models(provider),
      () => get<{ data: ModelItem[] }>(`/workspaces/current/model-providers/${provider}/models`),
      'static', // Model lists are relatively static
    ),
  )
}

export const useModelList = () => {
  return useQuery(
    createAppQueryConfig(
      QUERY_KEYS.modelList,
      () => get<{ data: ModelItem[] }>('/workspaces/current/models'),
      'static',
    ),
  )
}
