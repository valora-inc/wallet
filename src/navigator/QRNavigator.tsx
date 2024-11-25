import {
  MaterialTopTabBarProps,
  createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs'
import { useIsFocused } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Dimensions, Platform, StatusBar, StyleSheet, View } from 'react-native'
import { PERMISSIONS, RESULTS, check } from 'react-native-permissions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { QrScreenEvents } from 'src/analytics/Events'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { QRTabParamList, StackParamList } from 'src/navigator/types'
import QRCode from 'src/qrcode/QRCode'
import QRScanner from 'src/qrcode/QRScanner'
import QRTabBar from 'src/qrcode/QRTabBar'
import { useDispatch } from 'src/redux/hooks'
import { SVG, handleQRCodeDetected } from 'src/send/actions'
import { QrCode } from 'src/send/types'
import Colors from 'src/styles/colors'
import Logger from 'src/utils/Logger'

const Tab = createMaterialTopTabNavigator()

const width = Dimensions.get('window').width
const initialLayout = { width }

export type QRCodeProps = NativeStackScreenProps<QRTabParamList, Screens.QRCode> & {
  qrSvgRef: React.MutableRefObject<SVG>
}

export function QRCodePicker({ route, qrSvgRef, ...props }: QRCodeProps) {
  const onPressCopy = () => {
    AppAnalytics.track(QrScreenEvents.qr_screen_copy_address)
  }
  return <QRCode {...props} qrSvgRef={qrSvgRef} onPressCopy={onPressCopy} />
}

type ScannerSceneProps = NativeStackScreenProps<QRTabParamList, Screens.QRScanner>

// Component doing our custom transition for the QR scanner
function ScannerScene({ route }: ScannerSceneProps) {
  const lastScannedQR = useRef('')
  const dispatch = useDispatch()
  const defaultOnQRCodeDetected = (qrCode: QrCode) =>
    dispatch(
      handleQRCodeDetected({
        qrCode,
        defaultTokenIdOverride: route?.params?.defaultTokenIdOverride,
      })
    )
  const { onQRCodeDetected: onQRCodeDetectedParam = defaultOnQRCodeDetected } = route.params || {}
  const isFocused = useIsFocused()
  const [wasFocused, setWasFocused] = useState(isFocused)
  const cameraPermission = useAsync(check, [
    Platform.select({ ios: PERMISSIONS.IOS.CAMERA, default: PERMISSIONS.ANDROID.CAMERA }),
  ])
  // DENIED means the permission has not been requested / is denied but requestable
  const hasAskedCameraPermission =
    cameraPermission.result !== undefined && cameraPermission.result !== RESULTS.DENIED

  useEffect(() => {
    if (isFocused && !wasFocused) {
      setWasFocused(true)
    }
  }, [isFocused])

  // This only enables the camera when necessary.
  // There a special treatment for when we haven't asked the user for camera permission yet.
  // In that case we want to wait for the screen to be fully focused before enabling the camera so the
  // prompt doesn't show up in the middle of the slide animation.
  // Indeed, enabling the camera directly triggers the permission prompt with the current version of
  // react-native-camera.
  const enableCamera = isFocused || hasAskedCameraPermission || wasFocused

  const onQRCodeDetectedWrapper = (qrCode: QrCode) => {
    if (lastScannedQR.current === qrCode.data) {
      return
    }
    Logger.debug('QRScanner', 'Bar code detected')
    onQRCodeDetectedParam(qrCode)
    lastScannedQR.current = qrCode.data
  }

  return (
    <View style={styles.viewContainer}>
      {isFocused && <StatusBar barStyle="light-content" />}
      {enableCamera && <QRScanner onQRCodeDetected={onQRCodeDetectedWrapper} />}
    </View>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.QRNavigator>

export default function QRNavigator({ route }: Props) {
  const qrSvgRef = useRef<SVG>()
  const { t } = useTranslation()

  const tabBar = (props: MaterialTopTabBarProps) => (
    <QRTabBar
      {...props}
      qrSvgRef={qrSvgRef}
      canSwitch={!route.params?.params?.showSecureSendStyling}
      leftIcon={route.params?.params?.showSecureSendStyling ? 'back' : 'times'}
    />
  )

  return (
    <Tab.Navigator
      tabBar={tabBar}
      // Trick to position the tabs floating on top
      tabBarPosition="bottom"
      style={styles.container}
      sceneContainerStyle={styles.sceneContainerStyle}
      initialLayout={initialLayout}
    >
      <Tab.Screen name={Screens.QRCode} options={{ title: t('myCode') ?? undefined }}>
        {({ route, navigation }) => (
          <QRCodePicker
            navigation={navigation}
            route={{
              ...route,
              params: { ...route.params },
            }}
            qrSvgRef={qrSvgRef}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name={Screens.QRScanner} options={{ title: t('scanCode') ?? undefined }}>
        {(props) => <ScannerScene {...props} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

QRNavigator.navigationOptions = {
  ...noHeader,
  ...Platform.select({
    ios: { animation: 'slide_from_bottom' },
  }),
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.black,
  },
  sceneContainerStyle: {
    backgroundColor: Colors.black,
  },
  viewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
