import Touchable from '@celo/react-components/components/Touchable'
import BackChevron from '@celo/react-components/icons/BackChevron'
import ForwardChevron from '@celo/react-components/icons/ForwardChevron'
import Refresh from '@celo/react-components/icons/Refresh'
import colors from '@celo/react-components/styles/colors'
import { iconHitslop } from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch } from 'react-redux'
import { openDeepLink } from 'src/app/actions'
import WebView, { WebViewRef } from 'src/components/WebView'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import useBackHandler from 'src/utils/useBackHandler'
import { parse } from 'url'

type RouteProps = StackScreenProps<StackParamList, Screens.WebViewScreen>
type Props = RouteProps

function WebViewScreen({ route, navigation }: Props) {
  const { uri, headerTitle } = route.params
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const webviewRef = useRef<WebViewRef>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  useLayoutEffect(() => {
    const { hostname } = parse(uri)

    navigation.setOptions({
      headerLeft: () => (
        <TopBarTextButton
          title={t('close')}
          onPress={navigateBack}
          titleStyle={{ color: colors.gray4 }}
        />
      ),
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          title={headerTitle ?? hostname ?? ''}
          subTitle={headerTitle ? hostname : undefined}
        />
      ),
    })
  }, [navigation])

  useBackHandler(() => {
    // android hardware back button functions as either browser back button or
    // app back button
    if (canGoBack) {
      handleGoBack()
    } else {
      navigateBack()
    }
    return true
  }, [canGoBack, webviewRef?.current, navigation])

  const handleLoadRequest = (event: ShouldStartLoadRequest): boolean => {
    if (event.url.startsWith('celo://')) {
      dispatch(openDeepLink(event.url))
      return false
    }
    return true
  }

  const handleRefresh = () => {
    webviewRef.current?.reload()
  }

  const handleGoForward = () => {
    webviewRef.current?.goForward()
  }

  const handleGoBack = () => {
    webviewRef.current?.goBack()
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <WebView
        ref={webviewRef}
        originWhitelist={['https://*', 'celo://*']}
        onShouldStartLoadWithRequest={handleLoadRequest}
        setSupportMultipleWindows={false}
        source={{ uri }}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator style={styles.loading} size="large" />}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack)
          setCanGoForward(navState.canGoForward)
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
