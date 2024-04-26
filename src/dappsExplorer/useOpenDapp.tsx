import { Keyboard } from 'react-native'
import { DappExplorerEvents } from 'src/analytics/Events'
import { AnalyticsPropertiesList } from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { dappSelected } from 'src/dapps/slice'
import { ActiveDapp } from 'src/dapps/types'
import { useDispatch } from 'src/redux/hooks'

type ExtraAnalyticsProperties = Partial<AnalyticsPropertiesList[DappExplorerEvents.dapp_open]>

const useOpenDapp = () => {
  const dispatch = useDispatch()

  const openDapp = (dapp: ActiveDapp, extraAnalyticsProperties: ExtraAnalyticsProperties = {}) => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_open, {
      categories: dapp.categories,
      dappId: dapp.id,
      dappName: dapp.name,
      section: dapp.openedFrom,
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
