import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { QrScreenEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
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
    ValoraAnalytics.track(QrScreenEvents.qr_scanner_open)
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
