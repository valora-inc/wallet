import QRCodeBorderlessIcon from '@celo/react-components/icons/QRCodeBorderless'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import CustomHeader from 'src/components/header/CustomHeader'
import { Namespaces } from 'src/i18n'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'

interface Props {
  isOutgoingPaymentRequest: boolean
}
function SendHeader({ isOutgoingPaymentRequest }: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)

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
          icon={<Times />}
          onPress={navigateBack}
          eventName={
            isOutgoingPaymentRequest ? RequestEvents.request_cancel : SendEvents.send_cancel
          }
          style={styles.buttonContainer}
        />
      }
      title={isOutgoingPaymentRequest ? t('paymentRequestFlow:request') : t('sendFlow7:send')}
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
