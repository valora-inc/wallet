import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SendEvents } from 'src/analytics/Events'
import CustomHeader from 'src/components/header/CustomHeader'
import QRCodeBorderlessIcon from 'src/icons/QRCodeBorderless'
import Times from 'src/icons/Times'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { QRTabs, Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'

function SendHeader() {
  const { t } = useTranslation()

  const goToQRScanner = () =>
    navigate(Screens.QRNavigator, {
      tab: QRTabs.QRScanner,
    })

  return (
    <CustomHeader
      left={
        <TopBarIconButton
          icon={<Times />}
          onPress={navigateBack}
          eventName={SendEvents.send_cancel}
          style={styles.buttonContainer}
        />
      }
      title={t('send')}
      right={
        <TopBarIconButton
          icon={<QRCodeBorderlessIcon height={32} color={colors.primary} />}
          eventName={SendEvents.send_scan}
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
