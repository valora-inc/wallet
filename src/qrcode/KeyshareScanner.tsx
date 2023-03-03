import { useIsFocused } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { memoize } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Platform, StatusBar, StyleSheet } from 'react-native'
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { handleDetectedKeyshare } from 'src/import/actions'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import QRScanner from 'src/qrcode/QRScanner'
import { QrCode } from 'src/send/actions'

type OwnProps = {}
type Props = OwnProps & StackScreenProps<StackParamList, Screens.KeyshareScanner>

const KeyshareScanner = (_props: Props) => {
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

  const dispatch = useDispatch()
  // This only enables the camera when necessary.
  // There a special treatment for when we haven't asked the user for camera permission yet.
  // In that case we want to wait for the screen to be fully focused before enabling the camera so the
  // prompt doesn't show up in the middle of the slide animation.
  // Indeed, enabling the camera directly triggers the permission prompt with the current version of
  // react-native-camera.
  const enableCamera = isFocused || hasAskedCameraPermission || wasFocused

  const onBarCodeDetected = memoize(
    (qrCode: QrCode) => {
      dispatch(handleDetectedKeyshare(qrCode))
    },
    (qrCode) => qrCode.data
  )

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isFocused && <StatusBar barStyle="light-content" />}
      {enableCamera && <QRScanner onBarCodeDetected={onBarCodeDetected} isForKeyshare />}
    </SafeAreaView>
  )
}

KeyshareScanner.navigationOptions = {
  ...noHeader,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default KeyshareScanner
