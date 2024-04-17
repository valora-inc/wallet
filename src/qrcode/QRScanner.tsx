import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RNCamera } from 'react-native-camera'
import DeviceInfo from 'react-native-device-info'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Defs, Mask, Rect, Svg } from 'react-native-svg'
import Modal from 'src/components/Modal'
import TextButton from 'src/components/TextButton'
import NotAuthorizedView from 'src/qrcode/NotAuthorizedView'
import { QrCode } from 'src/send/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface QRScannerProps {
  onQRCodeDetected: (qrCode: QrCode) => void
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

export default function QRScanner({ onQRCodeDetected }: QRScannerProps) {
  const { t } = useTranslation()
  const inset = useSafeAreaInsets()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const isEmulator = DeviceInfo.useIsEmulator ? DeviceInfo.useIsEmulator().result : false

  /**
   * Emulator only. When in the emulator we want to be able
   * to enter QR codes manually.
   */
  const [value, setValue] = useState('')
  const [displayEntryModal, setDisplayEntryModal] = useState(false)

  const openModal = () => {
    setDisplayEntryModal(true)
  }

  const closeModal = () => {
    setDisplayEntryModal(false)
    setValue('')
  }

  const submitModal = () => {
    Keyboard.dismiss()
    closeModal()
    // add a delay to allow modal to close before calling onQRCodeDetected,
    // otherwise nothing is clickable in the next screen this navigates to. A
    // better solution is to use onModalHide prop of Modal, but this is an
    // emulator only feature, so this is good enough.
    setTimeout(() => {
      onQRCodeDetected({ type: '', data: value })
    }, 500)
  }

  const onModalTextChange = (text: string) => {
    setValue(text)
  }

  const cameraScanInfo = (
    <Text testID="CameraScanInfo" style={[styles.infoText, { marginBottom: inset.bottom }]}>
      {t('cameraScanInfo')}
    </Text>
  )

  return (
    <RNCamera
      style={styles.camera}
      type={RNCamera.Constants.Type.back}
      onBarCodeRead={onQRCodeDetected}
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

      <View>
        {isEmulator ? (
          <TouchableOpacity testID="ManualInputButton" onPress={openModal}>
            {cameraScanInfo}
          </TouchableOpacity>
        ) : (
          cameraScanInfo
        )}
      </View>

      <Modal isVisible={displayEntryModal}>
        <Text style={styles.manualTitle}>{t('enterQRCode')}</Text>
        <TextInput
          autoFocus={true}
          value={value}
          style={styles.manualInput}
          autoCapitalize="none"
          onChangeText={onModalTextChange}
          testID="ManualInput"
        />
        <View style={styles.actions}>
          <TextButton style={styles.cancelButton} onPress={closeModal}>
            {t('cancel')}
          </TextButton>
          <TextButton onPress={submitModal} testID="ManualSubmit">
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
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  manualInput: {
    ...fontStyles.regular,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 0,
    marginTop: 8,
    alignItems: 'flex-start',
    borderColor: colors.gray3,
    borderRadius: 4,
    borderWidth: 1.5,
    color: colors.black,
    height: 80,
    maxHeight: 150,
  },
  manualTitle: {
    marginBottom: 6,
    ...fontStyles.h2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  cancelButton: {
    color: colors.gray5,
  },
})
