import React, { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { dappSelected } from 'src/app/actions'
import { ActiveDapp } from 'src/app/reducers'
import { activeScreenSelector, recentDappsSelector } from 'src/app/selectors'
import DAppsBottomSheet from 'src/dappsExplorer/DAppsBottomSheet'
import { Screens } from 'src/navigator/Screens'
import { isDeepLink } from 'src/utils/linking'
import Logger from 'src/utils/Logger'

const TAG = 'DApps'

// Open the dapp if deep linked, or require confirmation to open the dapp
const useOpenDapp = () => {
  const recentlyUsedDapps = useSelector(recentDappsSelector)
  const activeScreen = useSelector(activeScreenSelector)
  const [showOpenDappConfirmation, setShowOpenDappConfirmation] = useState(false)
  const [selectedDapp, setSelectedDapp] = useState<ActiveDapp | null>(null)
  const dispatch = useDispatch()

  const recentlyUsedDappsMode = activeScreen === Screens.WalletHome

  const getEventProperties = (dapp: ActiveDapp) => ({
    categoryId: dapp.categoryId,
    dappId: dapp.id,
    dappName: dapp.name,
    section: dapp.openedFrom,
    horizontalPosition: recentlyUsedDappsMode
      ? recentlyUsedDapps.findIndex((recentlyUsedDapp) => recentlyUsedDapp.id === dapp.id)
      : undefined,
  })

  const onCancelOpenDapp = () => {
    setShowOpenDappConfirmation(false)
    if (selectedDapp) {
      ValoraAnalytics.track(
        DappExplorerEvents.dapp_bottom_sheet_dismiss,
        getEventProperties(selectedDapp)
      )
    }
  }

  const openDapp = (dapp: ActiveDapp) => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_open, getEventProperties(dapp))
    dispatch(dappSelected(dapp))
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

  const onSelectDapp = (dapp: ActiveDapp) => {
    const dappEventProps = getEventProperties(dapp)
    ValoraAnalytics.track(DappExplorerEvents.dapp_select, dappEventProps)

    if (isDeepLink(dapp.dappUrl)) {
      openDapp(dapp)
    } else {
      setSelectedDapp(dapp)
      setShowOpenDappConfirmation(true)
      ValoraAnalytics.track(DappExplorerEvents.dapp_bottom_sheet_open, dappEventProps)
    }
  }

  const ConfirmOpenDappBottomSheet = useMemo(
    () => (
      <DAppsBottomSheet
        onClose={onCancelOpenDapp}
        onConfirmOpenDapp={onOpenDapp}
        selectedDapp={selectedDapp}
        isVisible={showOpenDappConfirmation}
      />
    ),
    [selectedDapp, showOpenDappConfirmation]
  )

  return {
    onSelectDapp,
    ConfirmOpenDappBottomSheet,
  }
}

export default useOpenDapp
