import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useRef } from 'react'
import { useAsync } from 'react-async-hook'
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import WebView, { WebViewRef } from 'src/components/WebView'
import { CicoProviderNames } from 'src/fiatExchanges/reducer'
import { fetchProviderWidgetUrl, isExpectedUrl } from 'src/fiatExchanges/utils'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'

const TRANSAK_URI = networkConfig.transakWidgetUrl

type RouteProps = StackScreenProps<StackParamList, Screens.TransakScreen>
type Props = RouteProps

function TransakScreen({ route }: Props) {
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)

  // Remove when Transak supports deeplinks
  const webRedirectUrl = 'https://valoraapp.com/?done=true'
  const onNavigationStateChange = (event: any) =>
    event?.url?.startsWith(webRedirectUrl) && navigateHome()

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

  const fetchResponse = useAsync(
    () =>
      fetchProviderWidgetUrl(CicoProviderNames.Transak, {
        address: account,
        digitalAsset: currencyToBuy,
        fiatCurrency: currencyCode,
        fiatAmount: localAmount,
      }),
    []
  )

  const url = fetchResponse?.result
  // This should never happen
  if (url && !isExpectedUrl(url, TRANSAK_URI)) {
    return null
  }

  // Using Webview instead of InAppBrowswer because Transak doesn't
  // support deeplink redirects
  return (
    <View style={styles.container}>
      {!url ? (
        <ActivityIndicator size="large" color={colors.greenBrand} />
      ) : (
        <WebView
          ref={webview}
          source={{ uri: url }}
          onNavigationStateChange={onNavigationStateChange}
        />
      )}
    </View>
  )
}

TransakScreen.navigationOptions = () => ({
  ...emptyHeader,
  headerTitle: (TRANSAK_URI.match(/(?!(w+)\.)(-|\w)*(?:\w+\.)+\w+/) || [])[0],
  headerLeft: () => <TopBarTextButton title={i18n.t('global:done')} onPress={navigateBack} />,
})

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
  },
})

export default TransakScreen
