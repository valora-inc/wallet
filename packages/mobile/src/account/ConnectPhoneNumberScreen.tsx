import TextButton from '@celo/react-components/components/TextButton'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
// todo: change the image here
import { celoEducation1 } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

function onPressConnectButton() {
  navigate(Screens.VerificationEducationScreen, {
    hideOnboardingStep: true,
  })
}

export default function ConnectPhoneNumberScreen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View>
          <Image source={celoEducation1} style={styles.bodyImage} resizeMode="contain" />

          <Text style={styles.heading}>{t('connectPhoneNumber.title')}</Text>
          <Text style={styles.bodyText}>{t('connectPhoneNumber.body')}</Text>
        </View>
        <TextButton style={styles.connectButton} onPress={onPressConnectButton}>
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
