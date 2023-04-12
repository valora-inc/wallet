import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import QRCodeBorderlessIcon from 'src/icons/QRCodeBorderless'
import Times from 'src/icons/Times'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'

interface Props {
  isOutgoingPaymentRequest: boolean
  showBackButton: boolean
}
function SendHeader({ isOutgoingPaymentRequest, showBackButton }: Props) {
  const { t } = useTranslation()

  const goToQRScanner = () =>
    navigate(Screens.QRNavigator, {
      screen: Screens.QRScanner,
      params: {
        isOutgoingPaymentRequest,
      },
    })

  return (
    <CustomHeader
      left={
        <TopBarIconButton
          icon={showBackButton ? <BackButton /> : <Times />}
          onPress={navigateBack}
          eventName={
            isOutgoingPaymentRequest ? RequestEvents.request_cancel : SendEvents.send_cancel
          }
          style={styles.buttonContainer}
        />
      }
      title={isOutgoingPaymentRequest ? t('request') : t('send')}
      right={
        <TopBarIconButton
          icon={<QRCodeBorderlessIcon height={32} color={colors.greenUI} />}
          eventName={isOutgoingPaymentRequest ? RequestEvents.request_scan : SendEvents.send_scan}
          onPress={goToQRScanner}
          style={styles.buttonContainer}
        />
      }
    />
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    padding: variables.contentPadding,
  },
})

export default memo(SendHeader)
