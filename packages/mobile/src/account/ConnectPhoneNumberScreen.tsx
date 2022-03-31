import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TextButton from 'src/components/TextButton'
import { getVerified } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import fontStyles from 'src/styles/fonts'

function onPressConnectButton() {
  ValoraAnalytics.track(CICOEvents.connect_phone_start)
  navigate(Screens.VerificationEducationScreen, {
    hideOnboardingStep: true,
  })
}

export default function ConnectPhoneNumberScreen() {
  const { t } = useTranslation()

  // Log a cancel event on a "back" action (hardware back button, swipe, or normal navigate back)
  const navigation = useNavigation()
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      ValoraAnalytics.track(CICOEvents.link_bank_account_cancel)
    })
    // Unsubscribe will be called on unmount
    return unsubscribe
  }, [])

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View>
          <Image source={getVerified} style={styles.bodyImage} resizeMode="contain" />

          <Text style={styles.heading}>{t('connectPhoneNumber.title')}</Text>
          <Text style={styles.bodyText}>{t('connectPhoneNumber.body')}</Text>
        </View>
        <TextButton
          style={styles.connectButton}
          onPress={onPressConnectButton}
          testID="ConnectPhoneNumberLink"
        >
          {t('connectPhoneNumber.buttonText')}
        </TextButton>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
  },

  heading: {
    marginTop: 24,
    ...fontStyles.h2,
    textAlign: 'center',
  },
  bodyText: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingTop: 16,
    marginBottom: 24,
  },
  bodyImage: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  connectButton: {
    alignSelf: 'center',
    justifyContent: 'center',
  },
})
