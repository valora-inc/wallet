import {
  MaterialTopTabBarProps,
  createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs'
import { useIsFocused } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native'
import { PERMISSIONS, RESULTS, check } from 'react-native-permissions'
import Animated, { call, greaterThan, onChange } from 'react-native-reanimated'
import { ScrollPager } from 'react-native-tab-view'
import { useDispatch, useSelector } from 'react-redux'
import { QrScreenEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import { fetchExchanges } from 'src/fiatExchanges/utils'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { QRTabParamList, StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import QRCode from 'src/qrcode/components/QRCode'
import QRScanner from 'src/qrcode/components/QRScanner'
import QRTabBar from 'src/qrcode/components/QRTabBar'
import { QrCode, SVG, handleQRCodeDetected } from 'src/send/actions'
import Logger from 'src/utils/Logger'
import { ExtractProps } from 'src/utils/typescript'

const TAG = 'QRNavigator'

const Tab = createMaterialTopTabNavigator()

const width = Dimensions.get('window').width
const initialLayout = { width }

export type QRCodeProps = NativeStackScreenProps<QRTabParamList, Screens.QRCode> & {
  qrSvgRef: React.MutableRefObject<SVG>
}

type AnimatedScannerSceneProps = NativeStackScreenProps<QRTabParamList, Screens.QRScanner> & {
  position: Animated.Value<number>
}

export function QRCodePicker({ route, qrSvgRef, ...props }: QRCodeProps) {
  const userLocation = useSelector(userLocationDataSelector)
  const asyncExchanges = useAsync(async () => {
    try {
      const availableExchanges = await fetchExchanges(
        userLocation.countryCodeAlpha2,
        'CELO' // Default to CELO, since the user never makes a selection when arriving here
      )
      return availableExchanges
    } catch (error) {
      Logger.error(TAG, 'error fetching exchanges, displaying an empty array')
      return []
    }
  }, [])

  const onCloseBottomSheet = () => {
    ValoraAnalytics.track(QrScreenEvents.qr_screen_bottom_sheet_close)
  }
  const onPressCopy = () => {
    ValoraAnalytics.track(QrScreenEvents.qr_screen_copy_address)
  }
  const onPressInfo = () => {
    ValoraAnalytics.track(QrScreenEvents.qr_screen_bottom_sheet_open)
  }
  const onPressExchange = (exchange: ExternalExchangeProvider) => {
    ValoraAnalytics.track(QrScreenEvents.qr_screen_bottom_sheet_link_press, {
      exchange: exchange.name,
    })
  }
  return (
    <QRCode
      {...props}
      exchanges={asyncExchanges.result ?? []}
      qrSvgRef={qrSvgRef}
      onCloseBottomSheet={onCloseBottomSheet}
      onPressCopy={onPressCopy}
      onPressInfo={onPressInfo}
      onPressExchange={onPressExchange}
    />
  )
}

// Component doing our custom transition for the QR scanner
function AnimatedScannerScene({ route, position }: AnimatedScannerSceneProps) {
  const lastScannedQR = useRef('')
  const dispatch = useDispatch()
  const defaultOnQRCodeDetected = (qrCode: QrCode) => dispatch(handleQRCodeDetected(qrCode))
  const isFocused = useIsFocused()
  const [wasFocused, setWasFocused] = useState(isFocused)
  const [isPartiallyVisible, setIsPartiallyVisible] = useState(false)
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

  Animated.useCode(
    () =>
      onChange(
        greaterThan(position, 0),
        call([position], ([value]) => {
          setIsPartiallyVisible(value > 0)
        })
      ),
    [position]
  )

  const animatedStyle = useMemo(() => {
    const opacity = Animated.interpolateNode(position, {
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    const translateX = Animated.interpolateNode(position, {
      inputRange: [0, 1],
      outputRange: [-width, 0],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    const scale = Animated.interpolateNode(position, {
      inputRange: [0, 1],
      outputRange: [0.7, 1],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    return { flex: 1, opacity, transform: [{ translateX, scale }] }
  }, [position])

  // This only enables the camera when necessary.
  // There a special treatment for when we haven't asked the user for camera permission yet.
  // In that case we want to wait for the screen to be fully focused before enabling the camera so the
  // prompt doesn't show up in the middle of the slide animation.
  // Indeed, enabling the camera directly triggers the permission prompt with the current version of
  // react-native-camera.
  const enableCamera = isFocused || (isPartiallyVisible && (hasAskedCameraPermission || wasFocused))

  const onQRCodeDetectedWrapper = (qrCode: QrCode) => {
    if (lastScannedQR.current === qrCode.data) {
      return
    }

    Logger.debug('QRScanner', 'Bar code detected')
    defaultOnQRCodeDetected(qrCode)
    lastScannedQR.current = qrCode.data
  }

  return (
    <Animated.View style={animatedStyle}>
      {isFocused && <StatusBar barStyle="light-content" />}
      {enableCamera && <QRScanner onQRCodeDetected={onQRCodeDetectedWrapper} />}
    </Animated.View>
  )
}

// Use ScrollPager on iOS as it gives a better native feeling
const pager: ExtractProps<typeof Tab.Navigator>['pager'] =
  Platform.OS === 'ios' ? (props: any) => <ScrollPager {...props} /> : undefined

type Props = NativeStackScreenProps<StackParamList, Screens.QRNavigator>

export default function QRNavigator({ route }: Props) {
  const position = useRef(new Animated.Value(0)).current
  const qrSvgRef = useRef<SVG>()
  const { t } = useTranslation()

  const tabBar = (props: MaterialTopTabBarProps) => <QRTabBar {...props} qrSvgRef={qrSvgRef} />

  return (
    <Tab.Navigator
      position={position}
      tabBar={tabBar}
      // Trick to position the tabs floating on top
      tabBarPosition="bottom"
      pager={pager}
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
              params: undefined,
            }}
            qrSvgRef={qrSvgRef}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name={Screens.QRScanner} options={{ title: t('scanCode') ?? undefined }}>
        {({ route, navigation }) => (
          <AnimatedScannerScene
            navigation={navigation}
            route={{
              ...route,
              params: undefined,
            }}
            position={position}
          />
        )}
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
    backgroundColor: 'black',
  },
  sceneContainerStyle: {
    backgroundColor: 'black',
  },
})
