import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useAsync } from 'react-async-hook'
import { useSelector } from 'react-redux'
import InAppBrowser from 'src/components/InAppBrowser'
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

  const getSignedUrl = async () => {
    const response = await fetch(networkConfig.signMoonpayUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: currencyToBuy,
        address: account,
        fiatCurrency: currencyCode,
        fiatAmount: new BigNumber(localAmount).toString(),
      }),
    })
    const json = await response.json()
    return json.url
  }

  const fetchResponse = useAsync(getSignedUrl, [])
  const uri = fetchResponse?.result

  return <InAppBrowser uri={uri} isLoading={!uri} onCancel={navigateBack} />
}

export default MoonPayScreen
