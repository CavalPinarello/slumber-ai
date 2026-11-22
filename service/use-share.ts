import { useQuery } from '@tanstack/react-query'
import { getAppAccessModeByAppCode } from './share'
import { createAppQueryConfig } from './query-config'

export const useAppAccessModeByCode = (code: string | null) => {
  return useQuery(
    createAppQueryConfig(
      ['webapp', 'appAccessMode', code],
      () => {
        if (!code)
          return null
        return getAppAccessModeByAppCode(code)
      },
      'static', // Access mode rarely changes
      {
        enabled: !!code,
      },
    ),
  )
}
