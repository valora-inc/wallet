import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { QrScreenEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import ScanIcon from 'src/icons/ScanIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Spacing } from 'src/styles/styles'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function QrScanButton({ style, size, testID }: Props) {
  const onPress = () => {
    ValoraAnalytics.track(QrScreenEvents.qr_scanner_open)
    navigate(Screens.QRNavigator, { screen: Screens.QRScanner })
  }

  return (
    <View style={styles.container}>
      <Touchable
        testID={testID}
        onPress={onPress}
        style={[style, styles.button]}
        borderRadius={Spacing.Thick24}
      >
        <ScanIcon size={size} />
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: Spacing.Small12,
  },
})
