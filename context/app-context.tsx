'use client'

import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useContextSelector } from 'use-context-selector'
import type { FC, ReactNode } from 'react'
import { noop } from 'lodash-es'
import { fetchAppList } from '@/service/apps'
import Loading from '@/app/components/base/loading'
import { fetchCurrentWorkspace, fetchLanggeniusVersion, fetchUserProfile } from '@/service/common'
import type { App } from '@/types/app'
import type { ICurrentWorkspace, LangGeniusVersionResponse, UserProfileResponse } from '@/models/common'
import MaintenanceNotice from '@/app/components/header/maintenance-notice'
import { QUERY_KEYS, createAppQueryConfig } from '@/service/query-config'

export type AppContextValue = {
  apps: App[]
  refetchApps: VoidFunction
  userProfile: UserProfileResponse
  refetchUserProfile: VoidFunction
  currentWorkspace: ICurrentWorkspace
  isCurrentWorkspaceManager: boolean
  isCurrentWorkspaceOwner: boolean
  isCurrentWorkspaceEditor: boolean
  isCurrentWorkspaceDatasetOperator: boolean
  refetchCurrentWorkspace: VoidFunction
  pageContainerRef: React.RefObject<HTMLDivElement>
  langeniusVersionInfo: LangGeniusVersionResponse
  useSelector: typeof useSelector
  isLoadingCurrentWorkspace: boolean
  isLoadingApps: boolean
  isLoadingUserProfile: boolean
}

const initialLangeniusVersionInfo = {
  current_env: '',
  current_version: '',
  latest_version: '',
  release_date: '',
  release_notes: '',
  version: '',
  can_auto_update: false,
}

const initialWorkspaceInfo: ICurrentWorkspace = {
  id: '',
  name: '',
  plan: '',
  status: '',
  created_at: 0,
  role: 'normal',
  providers: [],
}

const AppContext = createContext<AppContextValue>({
  apps: [],
  refetchApps: noop,
  userProfile: {
    id: '',
    name: '',
    email: '',
    avatar: '',
    avatar_url: '',
    is_password_set: false,
  },
  currentWorkspace: initialWorkspaceInfo,
  isCurrentWorkspaceManager: false,
  isCurrentWorkspaceOwner: false,
  isCurrentWorkspaceEditor: false,
  isCurrentWorkspaceDatasetOperator: false,
  refetchUserProfile: noop,
  refetchCurrentWorkspace: noop,
  pageContainerRef: createRef(),
  langeniusVersionInfo: initialLangeniusVersionInfo,
  useSelector,
  isLoadingCurrentWorkspace: false,
  isLoadingApps: false,
  isLoadingUserProfile: false,
})

export function useSelector<T>(selector: (value: AppContextValue) => T): T {
  return useContextSelector(AppContext, selector)
}

export type AppContextProviderProps = {
  children: ReactNode
}

export const AppContextProvider: FC<AppContextProviderProps> = ({ children }) => {
  const pageContainerRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // React Query hooks replacing SWR
  const {
    data: appListResponse,
    refetch: refetchApps,
    isLoading: isLoadingApps,
  } = useQuery(
    createAppQueryConfig(
      QUERY_KEYS.apps,
      () => fetchAppList({ url: '/apps', params: { page: 1, limit: 30, name: '' } }),
      'apps',
    ),
  )

  const {
    data: userProfileResponse,
    refetch: refetchUserProfile,
    isLoading: isLoadingUserProfile,
  } = useQuery(
    createAppQueryConfig(
      QUERY_KEYS.userProfile,
      () => fetchUserProfile({ url: '/account/profile', params: {} }),
      'user',
    ),
  )

  const {
    data: currentWorkspaceResponse,
    refetch: refetchCurrentWorkspace,
    isLoading: isLoadingCurrentWorkspace,
  } = useQuery(
    createAppQueryConfig(
      QUERY_KEYS.currentWorkspace,
      () => fetchCurrentWorkspace({ url: '/workspaces/current', params: {} }),
      'user',
    ),
  )

  const [userProfile, setUserProfile] = useState<UserProfileResponse>()
  const [langeniusVersionInfo, setLangeniusVersionInfo] = useState<LangGeniusVersionResponse>(initialLangeniusVersionInfo)
  const [currentWorkspace, setCurrentWorkspace] = useState<ICurrentWorkspace>(initialWorkspaceInfo)
  const isCurrentWorkspaceManager = useMemo(() => ['owner', 'admin'].includes(currentWorkspace.role), [currentWorkspace.role])
  const isCurrentWorkspaceOwner = useMemo(() => currentWorkspace.role === 'owner', [currentWorkspace.role])
  const isCurrentWorkspaceEditor = useMemo(() => ['owner', 'admin', 'editor'].includes(currentWorkspace.role), [currentWorkspace.role])
  const isCurrentWorkspaceDatasetOperator = useMemo(() => currentWorkspace.role === 'dataset_operator', [currentWorkspace.role])
  // Process response data
  const apps = useMemo(() => {
    return appListResponse?.data || []
  }, [appListResponse])

  const updateUserProfileAndVersion = useCallback(async () => {
    if (userProfileResponse && !userProfileResponse.bodyUsed) {
      const result = await userProfileResponse.json()
      setUserProfile(result)
      const current_version = userProfileResponse.headers.get('x-version')
      const current_env = process.env.NODE_ENV === 'development' ? 'DEVELOPMENT' : userProfileResponse.headers.get('x-env')

      try {
        const versionData = await fetchLanggeniusVersion({ url: '/version', params: { current_version } })
        setLangeniusVersionInfo({ ...versionData, current_version, latest_version: versionData.version, current_env })
      }
      catch (error) {
        console.error('Failed to fetch version info:', error)
      }
    }
  }, [userProfileResponse])

  useEffect(() => {
    updateUserProfileAndVersion()
  }, [updateUserProfileAndVersion])

  useEffect(() => {
    if (currentWorkspaceResponse) {
      try {
        currentWorkspaceResponse.json().then((data) => {
          setCurrentWorkspace(data)
        })
      }
      catch (error) {
        console.error('Failed to parse workspace response:', error)
      }
    }
  }, [currentWorkspaceResponse])

  // Show loading state while essential data is loading
  const isLoading = isLoadingApps || isLoadingUserProfile || !userProfile

  if (isLoading)
    return <Loading type='app' />

  const contextValue = useMemo(() => ({
    apps,
    refetchApps: () => refetchApps(),
    userProfile: userProfile || {
      id: '',
      name: '',
      email: '',
      avatar: '',
      avatar_url: '',
      is_password_set: false,
    },
    refetchUserProfile: () => refetchUserProfile(),
    pageContainerRef,
    langeniusVersionInfo,
    useSelector,
    currentWorkspace,
    isCurrentWorkspaceManager,
    isCurrentWorkspaceOwner,
    isCurrentWorkspaceEditor,
    isCurrentWorkspaceDatasetOperator,
    refetchCurrentWorkspace: () => refetchCurrentWorkspace(),
    isLoadingCurrentWorkspace,
    isLoadingApps,
    isLoadingUserProfile,
  }), [
    apps,
    refetchApps,
    userProfile,
    refetchUserProfile,
    pageContainerRef,
    langeniusVersionInfo,
    currentWorkspace,
    isCurrentWorkspaceManager,
    isCurrentWorkspaceOwner,
    isCurrentWorkspaceEditor,
    isCurrentWorkspaceDatasetOperator,
    refetchCurrentWorkspace,
    isLoadingCurrentWorkspace,
    isLoadingApps,
    isLoadingUserProfile,
  ])

  return (
    <AppContext.Provider value={contextValue}>
      <div className='flex h-full flex-col overflow-y-auto'>
        {globalThis.document?.body?.getAttribute('data-public-maintenance-notice') && <MaintenanceNotice />}
        <div ref={pageContainerRef} className='relative flex grow flex-col overflow-y-auto overflow-x-hidden bg-background-body'>
          {children}
        </div>
      </div>
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)

export default AppContext
