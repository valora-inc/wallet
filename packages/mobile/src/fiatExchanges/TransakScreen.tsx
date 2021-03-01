import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useRef } from 'react'
import { BackHandler, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import WebView, { WebViewRef } from 'src/components/WebView'
import { CURRENCY_ENUM } from 'src/geth/consts'
import config from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'

const TRANSAK_URI = config.transakWidgetUrl
const MIN_USD_TX_AMOUNT = 15

export const transakOptions = () => ({
  ...emptyHeader,
  headerTitle: (TRANSAK_URI.match(/(?!(w+)\.)(-|\w)*(?:\w+\.)+\w+/) || [])[0],
  headerLeft: () => <TopBarTextButton title={i18n.t('global:done')} onPress={navigateBack} />,
})

type RouteProps = StackScreenProps<StackParamList, Screens.TransakScreen>
type Props = RouteProps

function TransakScreen({ route }: Props) {
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)

  let minTxAmount = MIN_USD_TX_AMOUNT

  if (currencyCode !== LocalCurrencyCode.USD) {
    const localTxMin = convertDollarsToLocalAmount(minTxAmount, localCurrencyExchangeRate)
    minTxAmount = localTxMin?.toNumber() || MIN_USD_TX_AMOUNT
  }

  const asset = {
    [CURRENCY_ENUM.GOLD]: 'CELO',
    [CURRENCY_ENUM.DOLLAR]: 'CUSD',
  }[currencyToBuy]

  // Replace with CASH_IN_SUCCESS_DEEPLINK when Transak supports deeplinks
  const webRedirectUrl = 'https://valoraapp.com/?done=true'

  const uri = `
    ${TRANSAK_URI}
      ?apiKey=${config.transakApiKey}
      &hostURL=${encodeURIComponent('https://www.valoraapp.com')}
      &walletAddress=${account}
      &disableWalletAddressForm=true
      &cryptoCurrencyCode=${asset}
      &fiatCurrency=${currencyCode}
      &defaultFiatAmount=${localAmount || minTxAmount}
      &redirectURL=${encodeURIComponent(webRedirectUrl)}
      &hideMenu=true
    `.replace(/\s+/g, '')

  const onNavigationStateChange = ({ url }: any) => url.startsWith(webRedirectUrl) && navigateHome()

  const webview = useRef<WebViewRef>(null)
  const onAndroidBackPress = (): boolean => {
    if (webview.current) {
      webview.current.goBack()
      return true
    }
    return false
  }

  useEffect((): (() => void) => {
    BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress)
    return (): void => {
      BackHandler.removeEventListener('hardwareBackPress', onAndroidBackPress)
    }
  }, [])

  // Using Webview instead of InAppBrowswer because Transak doesn't
  // support deeplink redirects
  return (
    <View style={styles.container}>
      <WebView ref={webview} source={{ uri }} onNavigationStateChange={onNavigationStateChange} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
  },
})

export default TransakScreen
