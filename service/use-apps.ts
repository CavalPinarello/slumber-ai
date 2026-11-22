import { useQuery } from '@tanstack/react-query'
import { get } from './base'
import { useInvalid } from './use-base'
import { QUERY_KEYS, createAppQueryConfig } from './query-config'
import type { App } from '@/types/app'
import type { AppListResponse } from '@/models/app'

// Standardized app queries using query config
export const useAppFullList = () => {
  return useQuery(
    createAppQueryConfig(
      QUERY_KEYS.appFullList,
      () => get<AppListResponse>('/apps', { params: { page: 1, limit: 100 } }),
      'apps',
    ),
  )
}

export const useInvalidateAppFullList = () => {
  return useInvalid(QUERY_KEYS.appFullList)
}

export const useAppDetail = (appID: string) => {
  return useQuery(
    createAppQueryConfig(
      QUERY_KEYS.appDetail(appID),
      () => get<App>(`/apps/${appID}`),
      'apps',
    ),
  )
}
