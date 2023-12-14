import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef } from 'react'
import { Dimensions } from 'react-native'
import BackButton from 'src/components/BackButton'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import QRScanner from 'src/qrcode/components/QRScanner'
import { QrCode } from 'src/send/actions'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'

type Props = NativeStackScreenProps<StackParamList, Screens.ScanQRScreen>

export default function ScanQRScreen({ route, navigation }: Props) {
  const lastScannedQR = useRef('')

  const { onQRCodeDetected } = route.params
  return (
    <QRScanner
      onQRCodeDetected={(qrCode: QrCode) => {
        if (lastScannedQR.current === qrCode.data) {
          return
        }
        Logger.debug('ScanQRScreen', 'Bar code detected')
        onQRCodeDetected(qrCode)
        lastScannedQR.current = qrCode.data
      }}
    />
  )
}

ScanQRScreen.navigationOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton color={Colors.white} />,
  headerTitle: i18n.t('scanCode'),
  headerTitleStyle: {
    ...fontStyles.navigationHeader,
    maxWidth: Dimensions.get('window').width * 0.6,
    textAlign: 'center',
    fontWeight: undefined,
    color: Colors.white,
  },
  headerTransparent: true,
  // Needed for Android to truly make the header transparent
  headerStyle: {
    backgroundColor: 'transparent',
  },
})
