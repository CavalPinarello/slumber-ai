import { createContext } from 'use-context-selector'
import { noop } from 'lodash-es'
import type { InstalledApp } from '@/models/explore'

type IExplore = {
  controlUpdateInstalledApps: number
  setControlUpdateInstalledApps: (controlUpdateInstalledApps: number) => void
  hasEditPermission: boolean
  installedApps: InstalledApp[]
  setInstalledApps: (installedApps: InstalledApp[]) => void
}

const ExploreContext = createContext<IExplore>({
  controlUpdateInstalledApps: 0,
  setControlUpdateInstalledApps: noop,
  hasEditPermission: false,
  installedApps: [],
  setInstalledApps: noop,
})

export default ExploreContext
