import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { QrScreenEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import ScanIcon from 'src/icons/ScanIcon'
import { navigate } from 'src/navigator/NavigationService'
import { QRTabs, Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function QrScanButton({ style, size, testID }: Props) {
  const onPress = () => {
    ValoraAnalytics.track(QrScreenEvents.qr_scanner_open)
    navigate(Screens.QRNavigator, { tab: QRTabs.QRScanner })
  }

  return (
    <TopBarIconButton
      testID={testID}
      icon={<ScanIcon size={size} />}
      onPress={onPress}
      style={style}
    />
  )
}
