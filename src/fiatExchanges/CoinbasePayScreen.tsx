import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { CoinbasePayEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import WebViewScreen from 'src/webview/WebViewScreen'

type RouteProps = StackScreenProps<StackParamList, Screens.WebViewScreen>
type Props = RouteProps

// Created specifically to hook into the removal of CBPay Screen for analytics
function CoinbasePayScreen({ route, navigation }: Props) {
  useEffect(() => {
    navigation.addListener('beforeRemove', () => {
      ValoraAnalytics.track(CoinbasePayEvents.coinbase_pay_flow_exit)
    })
  }, [])
  return <WebViewScreen {...{ route, navigation }} />
}

export default CoinbasePayScreen
