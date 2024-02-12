import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'

import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Props = NativeStackScreenProps<StackParamList, Screens.LinkPhoneNumber>

export default function LinkPhoneNumber({ navigation }: Props) {
  const { t } = useTranslation()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <BackButton />,
      headerStyle: {
        backgroundColor: colors.gray1,
      },
    })
  }, [navigation])

  const continueButtonOnPress = async () => {
    ValoraAnalytics.track(OnboardingEvents.link_phone_number)
    navigate(Screens.VerificationStartScreen, { hasOnboarded: false })
  }
  const laterButtonOnPress = async () => {
    ValoraAnalytics.track(OnboardingEvents.link_phone_number_later)
    navigateHome()
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View>
        <View style={styles.viewContainer}>
          <View style={styles.screenTextContainer}>
            <Text style={styles.screenTitle}>{t('linkPhoneNumber.title')}</Text>
            <Text style={styles.screenDescription}>{t('linkPhoneNumber.description')}</Text>
          </View>
        </View>
        <View style={styles.buttonView}>
          <Button
            text={t('linkPhoneNumber.startButtonLabel')}
            onPress={continueButtonOnPress}
            style={styles.button}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.FULL}
            testID="LinkPhoneNumberButton"
          />
          <Button
            text={t('linkPhoneNumber.later')}
            onPress={laterButtonOnPress}
            style={styles.button}
            type={BtnTypes.GRAY_WITH_BORDER}
            size={BtnSizes.FULL}
            testID="LinkPhoneNumberLater"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'center',
    backgroundColor: colors.gray1,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  screenDescription: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
  },
  screenTitle: {
    ...typeScale.titleSmall,
    marginTop: Spacing.Thick24,
    textAlign: 'center',
  },
  screenTextContainer: {
    gap: Spacing.Regular16,
  },
  viewContainer: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.Thick24,
    paddingHorizontal: Spacing.Thick24,
  },
  buttonView: {
    padding: Spacing.Thick24,
    alignItems: 'center',
  },
  button: { marginBottom: Spacing.Thick24, width: '100%' },
})
