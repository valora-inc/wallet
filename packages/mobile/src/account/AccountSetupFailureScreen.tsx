import React from 'react'
import { useTranslation } from 'react-i18next'
import RNExitApp from 'react-native-exit-app'
import AccountErrorScreen from 'src/account/AccountErrorScreen'
import { noHeaderGestureDisabled } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

function AccounSetupFailureScreen() {
  const { t } = useTranslation()

  const onPressCloseApp = () => {
    RNExitApp.exitApp()
  }

  const onPressContactSupport = () => {
    navigate(Screens.SupportContact)
  }

  return (
    <AccountErrorScreen
      title={t('accountSetupFailed')}
      testID="AccountSetupFailure"
      description={t('accountSetupFailedDescription')}
      onPress={onPressCloseApp}
      buttonLabel={t('closeApp')}
      onPressSecondary={onPressContactSupport}
      secondaryButtonLabel={t('contactSupport')}
    />
  )
}

AccounSetupFailureScreen.navOptions = noHeaderGestureDisabled

export default AccounSetupFailureScreen
