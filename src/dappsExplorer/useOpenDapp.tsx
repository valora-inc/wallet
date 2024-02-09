import { Keyboard } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import { AnalyticsPropertiesList } from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { activeScreenSelector } from 'src/app/selectors'
import { recentDappsSelector } from 'src/dapps/selectors'
import { dappSelected } from 'src/dapps/slice'
import { ActiveDapp } from 'src/dapps/types'
import { Screens } from 'src/navigator/Screens'

type ExtraAnalyticsProperties = Partial<AnalyticsPropertiesList[DappExplorerEvents.dapp_open]>

// Open the dapp if deep linked, or require confirmation to open the dapp
const useOpenDapp = () => {
  const recentlyUsedDapps = useSelector(recentDappsSelector)
  const activeScreen = useSelector(activeScreenSelector)
  const dispatch = useDispatch()

  const recentlyUsedDappsMode = activeScreen === Screens.WalletHome

  const getEventProperties = (dapp: ActiveDapp) => ({
    categories: dapp.categories,
    dappId: dapp.id,
    dappName: dapp.name,
    section: dapp.openedFrom,
    horizontalPosition: recentlyUsedDappsMode
      ? recentlyUsedDapps.findIndex((recentlyUsedDapp) => recentlyUsedDapp.id === dapp.id)
      : undefined,
  })

  const openDapp = (dapp: ActiveDapp, extraAnalyticsProperties: ExtraAnalyticsProperties = {}) => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_open, {
      ...getEventProperties(dapp),
      ...extraAnalyticsProperties,
    })
    dispatch(dappSelected({ dapp }))
    Keyboard.dismiss()
  }

  return {
    onSelectDapp: openDapp,
  }
}

export default useOpenDapp
