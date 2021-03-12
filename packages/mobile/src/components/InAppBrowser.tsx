import colors from '@celo/react-components/styles/colors'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native'
import { InAppBrowser as BroswerPackage } from 'react-native-inappbrowser-reborn'
import WebView, { WebViewRef } from 'src/components/WebView'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'

interface Props {
  uri: string
  isLoading: boolean
  onCancel?: () => void
}

enum BrowserStatuses {
  loading = 'loading',
  available = 'available',
  unavailable = 'unavailable',
}

const TAG = 'InAppBrowser'

function InAppBrowser({ uri, isLoading, onCancel }: Props) {
  const [browserStatus, setBrowserStatus] = useState<BrowserStatuses>(BrowserStatuses.loading)
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
    const isBrowserAvailable = async () => {
      setBrowserStatus(
        (await BroswerPackage.isAvailable())
          ? BrowserStatuses.available
          : BrowserStatuses.unavailable
      )
    }

    isBrowserAvailable().catch(() => Logger.error(TAG, 'Error checking for browser availability'))
  }, [])

  useEffect(() => {
    if (!uri) {
      return
    }
    const openBrowser = async () => {
      const finalEvent = await BroswerPackage.openAuth(uri, 'celo://wallet', {
        modalEnabled: true,
        modalPresentationStyle: 'fullScreen',
      })

      if (finalEvent.type === 'cancel' && onCancel) {
        onCancel()
      }

      if (finalEvent.type === 'success' && finalEvent.url?.startsWith('celo://wallet')) {
        navigateToURI(finalEvent.url)
      }
    }

    if (browserStatus === BrowserStatuses.available && !isLoading) {
      openBrowser().catch(() => Logger.error(TAG, 'Error opening broswer'))
    }
  }, [browserStatus, isLoading])

  return (
    <>
      {(isLoading || browserStatus === BrowserStatuses.loading) && (
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.greenBrand} />
        </View>
      )}
      {browserStatus === BrowserStatuses.unavailable && (
        <View style={styles.container}>
          <WebView source={{ uri }} ref={webview} />
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
  },
})

export default InAppBrowser
