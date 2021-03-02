import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import WebView, { WebViewRef } from 'src/components/WebView'
import { VALORA_KEY_DISTRIBUTER_URL } from 'src/config'
import { PROVIDER_ENUM } from 'src/fiatExchanges/ProviderOptionsScreen'
import { createApiKeyPostRequestObj } from 'src/fiatExchanges/utils'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'

const TRANSAK_URI = networkConfig.transakWidgetUrl

export const transakOptions = () => ({
  ...emptyHeader,
  headerTitle: (TRANSAK_URI.match(/(?!(w+)\.)(-|\w)*(?:\w+\.)+\w+/) || [])[0],
  headerLeft: () => <TopBarTextButton title={i18n.t('global:done')} onPress={navigateBack} />,
})

type RouteProps = StackScreenProps<StackParamList, Screens.TransakScreen>
type Props = RouteProps

function TransakScreen({ route }: Props) {
  const [apiKey, setApiKey] = useState<string>()
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)

  // Replace with CASH_IN_SUCCESS_DEEPLINK when Transak supports deeplinks
  const webRedirectUrl = 'https://valoraapp.com/?done=true'

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

  useEffect(() => {
    const postRequestObject = createApiKeyPostRequestObj(PROVIDER_ENUM.TRANSAK)
    const getApiKey = async () => {
      const response = await fetch(VALORA_KEY_DISTRIBUTER_URL, postRequestObject)
      return response.json()
    }

    getApiKey()
      .then(setApiKey)
      .catch(() => showError(ErrorMessages.FIREBASE_FAILED))
  }, [])

  const uri = `
  ${TRANSAK_URI}
    ?apiKey=${apiKey}
    &hostURL=${encodeURIComponent('https://www.valoraapp.com')}
    &walletAddress=${account}
    &disableWalletAddressForm=true
    &cryptoCurrencyCode=${currencyToBuy}
    &fiatCurrency=${currencyCode}
    &defaultFiatAmount=${localAmount}
    &redirectURL=${encodeURIComponent(webRedirectUrl)}
    &hideMenu=true
  `.replace(/\s+/g, '')

  // Using Webview instead of InAppBrowswer because Transak doesn't
  // support deeplink redirects
  return (
    <View style={styles.container}>
      {!apiKey ? (
        <ActivityIndicator size="large" color={colors.greenBrand} />
      ) : (
        <WebView ref={webview} source={{ uri }} onNavigationStateChange={onNavigationStateChange} />
      )}
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
