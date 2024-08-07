import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { CoinbasePayEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import WebViewScreen from 'src/webview/WebViewScreen'

type RouteProps = NativeStackScreenProps<StackParamList, Screens.WebViewScreen>
type Props = RouteProps

// Created specifically to hook into the removal of CBPay Screen for analytics
function CoinbasePayScreen({ route, navigation }: Props) {
  useEffect(() => {
    navigation.addListener('beforeRemove', () => {
      AppAnalytics.track(CoinbasePayEvents.coinbase_pay_flow_exit)
    })
  }, [])
  return <WebViewScreen {...{ route, navigation }} />
}

export default CoinbasePayScreen
