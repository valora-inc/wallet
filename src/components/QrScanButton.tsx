import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { QrScreenEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import ScanIcon from 'src/icons/ScanIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButtonV2 } from 'src/navigator/TopBarIconButtonV2'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function QrScanButton({ testID, size, style }: Props) {
  const onPress = () => {
    AppAnalytics.track(QrScreenEvents.qr_scanner_open)
    navigate(Screens.QRNavigator, { screen: Screens.QRScanner })
  }

  return (
    <TopBarIconButtonV2
      icon={<ScanIcon size={size} />}
      testID={testID}
      onPress={onPress}
      style={style}
    />
  )
}
