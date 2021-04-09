import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useAsync } from 'react-async-hook'
import { useSelector } from 'react-redux'
import InAppBrowser from 'src/components/InAppBrowser'
import { CicoProviderNames } from 'src/fiatExchanges/reducer'
import { fetchProviderWidgetUrl, isExpectedUrl } from 'src/fiatExchanges/utils'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'
import { CASH_IN_SUCCESS_DEEPLINK } from 'src/config'

const XANPOOL_URI = networkConfig.xanpoolWidgetUrl

type RouteProps = StackScreenProps<StackParamList, Screens.XanpoolScreen>
type Props = RouteProps

function XanpoolScreen({ route }: Props) {
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)

  const fetchResponse = useAsync(
    () =>
      fetchProviderWidgetUrl(CicoProviderNames.Xanpool, {
        address: account,
        digitalAsset: currencyToBuy,
        fiatCurrency: currencyCode,
        fiatAmount: localAmount,
      }),
    []
  )

  // const url = fetchResponse?.result
  const url = `
    ${XANPOOL_URI}
      ?apiKey=cc1a855fa723094ab527180a70a3b93a
      &wallet=${account}
      &cryptoCurrency=${currencyToBuy}
      &currency=${currencyCode}
      &fiat=${localAmount}
      &redirectUrl=${CASH_IN_SUCCESS_DEEPLINK}
      &isisWebWeb=true
  `.replace(/\s+/g, '')

  console.log({ url })
  // This should never happen
  if (url && !isExpectedUrl(url, XANPOOL_URI)) {
    return null
  }

  return <InAppBrowser uri={url} isLoading={!url} onCancel={navigateBack} />
}

XanpoolScreen.navigationOptions = () => ({
  ...emptyHeader,
  headerTitle: (XANPOOL_URI.match(/(?!(w+)\.)(-|\w)*(?:\w+\.)+\w+/) || [])[0],
  headerLeft: () => <TopBarTextButton title={i18n.t('global:done')} onPress={navigateBack} />,
})

export default XanpoolScreen
