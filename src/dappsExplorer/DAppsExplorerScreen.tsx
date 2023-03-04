import React from 'react'
import { dappsFilterEnabledSelector } from 'src/dapps/selectors'
import DAppsExplorerScreenFilter from 'src/dappsExplorer/DAppsExplorerScreenFilter'
import DAppsExplorerScreenLegacy from 'src/dappsExplorer/DAppsExplorerScreenLegacy'
import useSelector from 'src/redux/useSelector'

function DAppsExplorerScreen() {
  const dappFilterEnabled = useSelector(dappsFilterEnabledSelector)

  if (dappFilterEnabled) return <DAppsExplorerScreenFilter />
  return <DAppsExplorerScreenLegacy />
}

export default DAppsExplorerScreen
