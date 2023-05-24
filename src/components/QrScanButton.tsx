import React from 'react'
import ScanIcon from 'src/icons/ScanIcon'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { QrScreenEvents } from 'src/analytics/Events'
import { Screens } from 'src/navigator/Screens'
import { CloseIcon } from 'src/navigator/types'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StyleProp, ViewStyle } from 'react-native'

interface Props {
  fromScreen: Screens
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function QrScanButton({ fromScreen, style, size, testID }: Props) {
  const onPress = () => {
    ValoraAnalytics.track(QrScreenEvents.qr_scanner_open, {
      fromScreen,
    })
    navigate(Screens.QRNavigator, {
      screen: Screens.QRScanner,
      closeIcon: CloseIcon.BackChevron,
    })
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
