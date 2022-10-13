import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import CustomHeader from 'src/components/header/CustomHeader'
import Times from 'src/icons/Times'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import variables from 'src/styles/variables'

interface Props {
  isOutgoingPaymentRequest: boolean
}
function SendHeader({ isOutgoingPaymentRequest }: Props) {
  const { t } = useTranslation()

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
      title={isOutgoingPaymentRequest ? t('request') : t('send')}
    />
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    padding: variables.contentPadding,
  },
})

export default memo(SendHeader)
