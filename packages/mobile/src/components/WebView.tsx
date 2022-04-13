import React from 'react'
import { Platform, StyleSheet } from 'react-native'
import { WebView as RNWebView, WebViewProps } from 'react-native-webview'
import { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes'
import Logger from 'src/utils/Logger'

export type WebViewRef = RNWebView

// This is to prevent a crash on specific Android versions,
// see https://github.com/react-native-webview/react-native-webview/issues/429
const SHOULD_USE_OPACITY_HACK = Platform.OS === 'android' && Platform.Version >= 28

const WebView = React.forwardRef<WebViewRef, WebViewProps>(
  ({ style, onError, ...passThroughProps }, ref) => {
    function onErrorHandler(event: WebViewErrorEvent) {
      const { domain, code, description, url } = event.nativeEvent
      Logger.error(
        'WebView',
        `Error: domain:${domain}, code:${code}, description:${description}, url:${url}`
      )
      onError?.(event)
    }
    return (
      <RNWebView
        ref={ref}
        testID="RNWebView"
        // Matches UIScrollView behavior on iOS
        decelerationRate="normal"
        {...passThroughProps}
        style={SHOULD_USE_OPACITY_HACK ? [style, styles.opacityHack] : style}
        onError={onErrorHandler}
      />
    )
  }
)

const styles = StyleSheet.create({
  opacityHack: {
    opacity: 0.99,
  },
})

export default WebView
