'use client'

import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useContextSelector } from 'use-context-selector'
import type { FC, ReactNode } from 'react'
import { noop } from 'lodash-es'
import { fetchAppList } from '@/service/apps'
import Loading from '@/app/components/base/loading'
import { fetchCurrentWorkspace, fetchLanggeniusVersion, fetchUserProfile } from '@/service/common'
import type { App } from '@/types/app'
import type { ICurrentWorkspace, LangGeniusVersionResponse, UserProfileResponse } from '@/models/common'
import MaintenanceNotice from '@/app/components/header/maintenance-notice'

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
})

export function useSelector<T>(selector: (value: AppContextValue) => T): T {
  return useContextSelector(AppContext, selector)
}

export type AppContextProviderProps = {
  children: ReactNode
}

export const AppContextProvider: FC<AppContextProviderProps> = ({ children }) => {
  const pageContainerRef = useRef<HTMLDivElement>(null)

  // React Query hooks replacing SWR
  const {
    data: appListResponse,
    refetch: refetchApps,
    isLoading: isLoadingApps,
  } = useQuery({
    queryKey: ['apps', { page: 1, limit: 30, name: '' }],
    queryFn: () => fetchAppList({ url: '/apps', params: { page: 1, limit: 30, name: '' } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })

  const {
    data: userProfileResponse,
    refetch: refetchUserProfile,
    isLoading: isLoadingUserProfile,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => fetchUserProfile({ url: '/account/profile', params: {} }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })

  const {
    data: currentWorkspaceResponse,
    refetch: refetchCurrentWorkspace,
    isLoading: isLoadingCurrentWorkspace,
  } = useQuery({
    queryKey: ['currentWorkspace'],
    queryFn: () => fetchCurrentWorkspace({ url: '/workspaces/current', params: {} }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })

  const [userProfile, setUserProfile] = useState<UserProfileResponse>()
  const [langeniusVersionInfo, setLangeniusVersionInfo] = useState<LangGeniusVersionResponse>(initialLangeniusVersionInfo)
  const [currentWorkspace, setCurrentWorkspace] = useState<ICurrentWorkspace>(initialWorkspaceInfo)

  const isCurrentWorkspaceManager = useMemo(() =>
    ['owner', 'admin'].includes(currentWorkspace.role),
  [currentWorkspace.role],
  )
  const isCurrentWorkspaceOwner = useMemo(() =>
    currentWorkspace.role === 'owner',
  [currentWorkspace.role],
  )
  const isCurrentWorkspaceEditor = useMemo(() =>
    ['owner', 'admin', 'editor'].includes(currentWorkspace.role),
  [currentWorkspace.role],
  )
  const isCurrentWorkspaceDatasetOperator = useMemo(() =>
    currentWorkspace.role === 'dataset_operator',
  [currentWorkspace.role],
  )

  const updateUserProfileAndVersion = useCallback(async () => {
    if (userProfileResponse && !userProfileResponse.bodyUsed) {
      const result = await userProfileResponse.json()
      setUserProfile(result)
      const current_version = userProfileResponse.headers.get('x-version')
      const current_env = process.env.NODE_ENV === 'development' ? 'DEVELOPMENT' : userProfileResponse.headers.get('x-env')
      const versionData = await fetchLanggeniusVersion({ url: '/version', params: { current_version } })
      setLangeniusVersionInfo({ ...versionData, current_version, latest_version: versionData.version, current_env })
    }
  }, [userProfileResponse])

  useEffect(() => {
    updateUserProfileAndVersion()
  }, [updateUserProfileAndVersion])

  useEffect(() => {
    if (currentWorkspaceResponse) {
      currentWorkspaceResponse.json().then((data) => {
        setCurrentWorkspace(data)
      })
    }
  }, [currentWorkspaceResponse])

  // Extract apps data from response
  const apps = useMemo(() => {
    if (appListResponse) {
      try {
        return appListResponse.data || []
      }
      catch {
        return []
      }
    }
    return []
  }, [appListResponse])

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
    currentWorkspace,
    isCurrentWorkspaceManager,
    isCurrentWorkspaceOwner,
    isCurrentWorkspaceEditor,
    isCurrentWorkspaceDatasetOperator,
    refetchCurrentWorkspace: () => refetchCurrentWorkspace(),
    pageContainerRef,
    langeniusVersionInfo,
    useSelector,
    isLoadingCurrentWorkspace,
  }), [
    apps,
    refetchApps,
    userProfile,
    refetchUserProfile,
    currentWorkspace,
    isCurrentWorkspaceManager,
    isCurrentWorkspaceOwner,
    isCurrentWorkspaceEditor,
    isCurrentWorkspaceDatasetOperator,
    refetchCurrentWorkspace,
    pageContainerRef,
    langeniusVersionInfo,
    isLoadingCurrentWorkspace,
  ])

  const loading = isLoadingApps || isLoadingUserProfile || isLoadingCurrentWorkspace

  if (loading) {
    return (
      <Loading type='app' />
    )
  }

  return (
    <AppContext.Provider value={contextValue}>
      <MaintenanceNotice />
      <div
        ref={pageContainerRef}
        className="relative flex flex-col h-full overflow-y-auto"
      >
        {children}
      </div>
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)

export default AppContext
