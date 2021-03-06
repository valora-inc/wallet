import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useAsync } from 'react-async-hook'
import { useSelector } from 'react-redux'
import InAppBrowser from 'src/components/InAppBrowser'
import { Providers } from 'src/fiatExchanges/ProviderOptionsScreen'
import { fetchProviderUrl, isExpectedUrl } from 'src/fiatExchanges/utils'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'

const MOONPAY_URI = networkConfig.moonpayWidgetUrl

export const moonPayOptions = () => ({
  ...emptyHeader,
  headerTitle: (MOONPAY_URI.match(/(?!(w+)\.)(-|\w)*(?:\w+\.)+\w+/) || [])[0],
  headerLeft: () => <TopBarTextButton title={i18n.t('global:done')} onPress={navigateBack} />,
})

type RouteProps = StackScreenProps<StackParamList, Screens.MoonPayScreen>
type Props = RouteProps

function MoonPayScreen({ route }: Props) {
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)

  const fetchResponse = useAsync(
    () =>
      fetchProviderUrl(Providers.MOONPAY, {
        address: account,
        digitalAsset: currencyToBuy,
        fiatCurrency: currencyCode,
        fiatAmount: localAmount,
      }),
    []
  )

  const url = fetchResponse?.result
  // This should never happen
  if (url && !isExpectedUrl(url, MOONPAY_URI)) {
    return null
  }

  return <InAppBrowser uri={url} isLoading={!url} onCancel={navigateBack} />
}

export default MoonPayScreen
