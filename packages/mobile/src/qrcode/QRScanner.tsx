import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RNCamera } from 'react-native-camera'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Defs, Mask, Rect, Svg } from 'react-native-svg'
import Modal from 'src/components/Modal'
import { Namespaces } from 'src/i18n'
import NotAuthorizedView from 'src/qrcode/NotAuthorizedView'
import { QrCode } from 'src/send/actions'

interface QRScannerProps {
  onBarCodeDetected: (qrCode: QrCode) => void
}

const SeeThroughOverlay = () => {
  const { width, height } = useSafeAreaFrame()

  const margin = 40
  const centerBoxSize = width - margin * 2
  const centerBoxBorderRadius = 8

  // TODO(jeanregisser): Investigate why the mask is pixelated on iOS.
  // It's visible on the rounded corners but since they are small, I'm ignoring it for now.
  return (
    <Svg height={height} width={width} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <Mask id="mask" x="0" y="0" height="100%" width="100%">
          <Rect height="100%" width="100%" fill="#fff" />
          <Rect
            x={margin}
            y={(height - centerBoxSize) / 2}
            rx={centerBoxBorderRadius}
            ry={centerBoxBorderRadius}
            width={centerBoxSize}
            height={centerBoxSize}
            fill="#000"
          />
        </Mask>
      </Defs>
      <Rect height="100%" width="100%" fill="rgba(0,0,0,0.5)" mask="url(#mask)" />
    </Svg>
  )
}

export default function QRScanner({ onBarCodeDetected }: QRScannerProps) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const inset = useSafeAreaInsets()
  const [manualValue, setManualValue] = useState('')
  const [displayManual, setDisplayManual] = useState(false)

  return (
    <RNCamera
      style={styles.camera}
      type={RNCamera.Constants.Type.back}
      onBarCodeRead={onBarCodeDetected}
      barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
      flashMode={RNCamera.Constants.FlashMode.auto}
      captureAudio={false}
      autoFocus={RNCamera.Constants.AutoFocus.on}
      // Passing null here since we want the default system message
      // @ts-ignore
      androidCameraPermissionOptions={null}
      notAuthorizedView={<NotAuthorizedView />}
      testID={'Camera'}
    >
      <SeeThroughOverlay />

      <TouchableOpacity onPress={() => setDisplayManual(true)}>
        <Text style={[styles.infoText, { marginBottom: inset.bottom, paddingHorizontal: 30 }]}>
          {t('cameraScanInfo')}
        </Text>
      </TouchableOpacity>

      <Modal isVisible={displayManual}>
        <Text style={styles.title}>Enter QR code</Text>
        <TextInput
          autoFocus
          value={manualValue}
          style={styles.currencyInput}
          autoCapitalize="none"
          onChangeText={(text) => setManualValue(text)}
        />
        <View style={styles.actions}>
          <TextButton
            style={{ color: colors.gray5 }}
            onPress={() => {
              setDisplayManual(false)
              setManualValue('')
            }}
          >
            {t('cancel')}
          </TextButton>
          <TextButton
            style={{}}
            onPress={() => {
              onBarCodeDetected({ type: '', data: manualValue })
              setDisplayManual(false)
              setManualValue('')
            }}
          >
            {t('submit')}
          </TextButton>
        </View>
      </Modal>
    </RNCamera>
  )
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    overflow: 'hidden',
  },
  infoText: {
    position: 'absolute',
    left: 9,
    right: 9,
    bottom: 32,
    ...fontStyles.small600,
    lineHeight: undefined,
    color: colors.light,
    textAlign: 'center',
  },
  currencyInput: {
    ...fontStyles.regular,
    marginBottom: 12,
    // paddingTop: 0,
    // paddingLeft: 10,
    // paddingRight: 10,
    // flex: 1,
    // textAlign: 'right',
    // fontSize: 24,
    // lineHeight: Platform.select({ android: 39, ios: 30 }), // vertical align = center
    // height: 60, // setting height manually b.c. of bug causing text to jump on Android
    // color: colors.goldDark,
    // borderWidth: 1,
    // borderRadius: 8,
    // borderColor: colors.gray5,

    ...fontStyles.regular,
    paddingHorizontal: 12,
    paddingVertical: 0,
    marginTop: 8,
    alignItems: 'flex-start',
    borderColor: colors.gray3,
    borderRadius: 4,
    borderWidth: 1.5,
    color: colors.dark,
    height: 80,
    maxHeight: 150,
  },
  title: {
    // textAlign: 'center',
    marginBottom: 6,
    ...fontStyles.h2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
})
