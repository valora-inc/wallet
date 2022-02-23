import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openUrl, recentDappSelected } from 'src/app/actions'
import { Dapp } from 'src/app/types'
import DAppsBottomSheet from 'src/dappsExplorer/DAppsBottomSheet'
import { isDeepLink } from 'src/utils/linking'
import Logger from 'src/utils/Logger'

const TAG = 'DApps'

// Open the dapp if deep linked, or require confirmation to open the dapp
const useOpenDapp = () => {
  const [showOpenDappConfirmation, setShowOpenDappConfirmation] = useState(false)
  const [selectedDapp, setSelectedDapp] = useState<Dapp | null>(null)
  const dispatch = useDispatch()

  const onCancelOpenDapp = () => {
    setShowOpenDappConfirmation(false)
    if (selectedDapp) {
      ValoraAnalytics.track(DappExplorerEvents.dapp_bottom_sheet_dismiss, {
        categoryId: selectedDapp.categoryId,
        dappId: selectedDapp.id,
        dappName: selectedDapp.name,
        horizontalPosition: 0,
        section: selectedDapp.isFeatured ? 'featured' : 'all',
      })
    }
  }

  const openDapp = (dapp: Dapp) => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_open, {
      categoryId: dapp.categoryId,
      dappId: dapp.id,
      dappName: dapp.name,
      section: dapp.isFeatured ? 'featured' : 'all',
      horizontalPosition: 0,
    })
    dispatch(recentDappSelected(dapp))
    dispatch(openUrl(dapp.dappUrl, true, true))
  }

  const onOpenDapp = () => {
    if (!selectedDapp) {
      // Should never happen
      Logger.error(TAG, 'Internal error. There was no dapp selected')
      return
    }
    openDapp(selectedDapp)
    setShowOpenDappConfirmation(false)
  }

  const onSelectDapp = (dapp: Dapp) => {
    const dappEventProps = {
      categoryId: dapp.categoryId,
      dappId: dapp.id,
      dappName: dapp.name,
      horizontalPosition: 0,
      section: dapp.isFeatured ? 'featured' : 'all',
    }
    ValoraAnalytics.track(DappExplorerEvents.dapp_select, dappEventProps)

    if (isDeepLink(dapp.dappUrl)) {
      openDapp(dapp)
    } else {
      setSelectedDapp(dapp)
      setShowOpenDappConfirmation(true)
      ValoraAnalytics.track(DappExplorerEvents.dapp_bottom_sheet_open, dappEventProps)
    }
  }

  const ConfirmOpenDappBottomSheet = (
    <DAppsBottomSheet
      onClose={onCancelOpenDapp}
      onConfirmOpenDapp={onOpenDapp}
      selectedDapp={selectedDapp}
      isVisible={showOpenDappConfirmation}
    />
  )

  return {
    onSelectDapp,
    ConfirmOpenDappBottomSheet,
  }
}

export default useOpenDapp
