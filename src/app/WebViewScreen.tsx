import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch, useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { dappSessionEnded, openDeepLink } from 'src/app/actions'
import { activeDappSelector } from 'src/app/selectors'
import Touchable from 'src/components/Touchable'
import WebView, { WebViewRef } from 'src/components/WebView'
import BackChevron from 'src/icons/BackChevron'
import ForwardChevron from 'src/icons/ForwardChevron'
import Refresh from 'src/icons/Refresh'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import { iconHitslop } from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import useBackHandler from 'src/utils/useBackHandler'
import { isWalletConnectDeepLink } from 'src/walletConnect/walletConnect'
import { parse } from 'url'

type RouteProps = StackScreenProps<StackParamList, Screens.WebViewScreen>
type Props = RouteProps

function WebViewScreen({ route, navigation }: Props) {
  const { uri, dappkitDeeplink } = route.params

  const dispatch = useDispatch()
  const { t } = useTranslation()
  const activeDapp = useSelector(activeDappSelector)

  const webViewRef = useRef<WebViewRef>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  const handleSetNavigationTitle = useCallback(
    (url: string, title: string, loading: boolean) => {
      let hostname = ' '
      let displayedTitle = ' '

      try {
        hostname = parse(url).hostname ?? ' '
        // when first loading, the title of the webpage is unknown and the title
        // defaults to the url - display a loading placeholder in this case
        const parsedTitleUrl = parse(title)
        displayedTitle =
          loading || !title || (parsedTitleUrl.protocol && parsedTitleUrl.hostname)
            ? t('loading')
            : title
      } catch (error) {
        Logger.error(
          'WebViewScreen',
          `could not parse url for screen header, with url ${url} and title ${title}`,
          error
        )
      }

      navigation.setOptions({
        headerTitle: () => <HeaderTitleWithSubtitle title={displayedTitle} subTitle={hostname} />,
      })
    },
    [navigation]
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TopBarTextButton
          title={t('close')}
          onPress={navigateBack}
          titleStyle={{ color: colors.gray4 }}
        />
      ),
    })
  }, [navigation])

  useEffect(() => {
    return () => {
      // end the active dapp session when the screen is unmounted (e.g. screen
      // dismissed via header close button or via gesture/device back button)
      // note that the dependency array is empty so the values used here are
      // captured on screen mount, which works for now but may need to be
      // refreshed in the future
      if (activeDapp) {
        dispatch(dappSessionEnded())
        ValoraAnalytics.track(DappExplorerEvents.dapp_close, {
          categoryId: activeDapp.categoryId,
          dappId: activeDapp.id,
          dappName: activeDapp.name,
          section: activeDapp.openedFrom,
        })
      }
    }
  }, [])

  useEffect(() => {
    if (activeDapp && dappkitDeeplink) {
      webViewRef.current?.injectJavaScript(
        `window.history.replaceState({}, "", "${dappkitDeeplink}"); true;`
      )
    }
  }, [dappkitDeeplink, activeDapp])

  useBackHandler(() => {
    // android hardware back button functions as either browser back button or
    // app back button
    if (canGoBack) {
      handleGoBack()
    } else {
      navigateBack()
    }
    return true
  }, [canGoBack, webViewRef.current, navigation])

  const handleLoadRequest = (event: ShouldStartLoadRequest): boolean => {
    if (event.url.startsWith('celo://') || isWalletConnectDeepLink(event.url)) {
      dispatch(openDeepLink(event.url))
      return false
    }
    return true
  }

  const handleRefresh = () => {
    webViewRef.current?.reload()
  }

  const handleGoForward = () => {
    webViewRef.current?.goForward()
  }

  const handleGoBack = () => {
    webViewRef.current?.goBack()
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <WebView
        ref={webViewRef}
        originWhitelist={['https://*', 'celo://*']}
        onShouldStartLoadWithRequest={handleLoadRequest}
        source={{ uri }}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator style={styles.loading} size="large" />}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack)
          setCanGoForward(navState.canGoForward)
          handleSetNavigationTitle(navState.url, navState.title, navState.loading)
        }}
      />
      <View style={styles.navBar}>
        <Touchable
          onPress={handleGoBack}
          hitSlop={iconHitslop}
          disabled={!canGoBack}
          testID="WebViewScreen/GoBack"
        >
          <BackChevron color={canGoBack ? colors.dark : colors.gray3} />
        </Touchable>
        <Touchable
          onPress={handleGoForward}
          hitSlop={iconHitslop}
          disabled={!canGoForward}
          testID="WebViewScreen/GoForward"
        >
          <ForwardChevron color={canGoForward ? colors.dark : colors.gray3} />
        </Touchable>
        <Touchable onPress={handleRefresh} hitSlop={iconHitslop} testID="WebViewScreen/Refresh">
          <Refresh height={20} color={colors.dark} />
        </Touchable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  navBar: {
    height: 52,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    borderTopWidth: 1,
    borderColor: colors.gray2,
  },
})

export default WebViewScreen
