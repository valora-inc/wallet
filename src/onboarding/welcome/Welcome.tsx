import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { acceptTerms, chooseCreateAccount, chooseRestoreAccount } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TOS_LINK } from 'src/brandingConfig'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CheckBox from 'src/icons/CheckBox'
import Logo from 'src/icons/Logo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import LanguageButton from 'src/onboarding/LanguageButton'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getExperimentParams, patchUpdateStatsigUser } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { navigateToURI } from 'src/utils/linking'

export default function Welcome() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const acceptedTerms = useSelector((state) => state.account.acceptedTerms)
  const startOnboardingTime = useSelector((state) => state.account.startOnboardingTime)
  const insets = useSafeAreaInsets()
  const recoveringFromStoreWipe = useSelector(recoveringFromStoreWipeSelector)
  const [termsCheckbox, toggleTermsCheckBox] = useState(acceptedTerms)

  const { variant } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.ONBOARDING_TERMS_AND_CONDITIONS]
  )

  const showTermsCheckbox = variant === 'checkbox'
  const buttonsDisabled = showTermsCheckbox && !termsCheckbox

  const startOnboarding = () => {
    navigate(
      firstOnboardingScreen({
        recoveringFromStoreWipe,
      })
    )
  }

  const navigateNext = () => {
    if (!acceptedTerms && !showTermsCheckbox) {
      navigate(Screens.RegulatoryTerms)
    } else {
      if (showTermsCheckbox && !acceptedTerms) {
        // if terms have not already been accepted, fire the analytics event
        // and dispatch the action to accept the terms
        ValoraAnalytics.track(OnboardingEvents.terms_and_conditions_accepted)
        dispatch(acceptTerms())
      }
      startOnboarding()
    }
  }

  const onPressCreateAccount = async () => {
    ValoraAnalytics.track(OnboardingEvents.create_account_start)
    const now = Date.now()
    if (startOnboardingTime === undefined) {
      // this is the user's first time selecting 'create account' on this device
      // this lets us restrict some onboarding experiments to only users who begin onboarding
      //  after the experiment begins
      await patchUpdateStatsigUser({ custom: { startOnboardingTime: now } })
    }
    dispatch(chooseCreateAccount(now))
    navigateNext()
  }

  const onPressRestoreAccount = () => {
    ValoraAnalytics.track(OnboardingEvents.restore_account_start)
    dispatch(chooseRestoreAccount())
    navigateNext()
  }

  const onPressTerms = () => {
    navigateToURI(TOS_LINK)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Logo size={64} />
        <Text style={styles.title} testID={'WelcomeText'}>
          {t('welcome.header')}
        </Text>
      </ScrollView>
      <View style={{ marginBottom: Math.max(0, 40 - insets.bottom) }}>
        {showTermsCheckbox && (
          <View style={styles.termsContainer}>
            <TouchableOpacity onPress={() => toggleTermsCheckBox((prev) => !prev)}>
              <CheckBox
                testID="TermsCheckbox"
                checked={termsCheckbox}
                checkedColor={colors.black}
                uncheckedColor={colors.black}
              />
            </TouchableOpacity>
            <Text style={styles.termsText}>
              <Trans i18nKey="welcome.agreeToTerms">
                <Text onPress={onPressTerms} style={styles.termsTextLink} />
              </Trans>
            </Text>
          </View>
        )}

        <Button
          onPress={onPressCreateAccount}
          text={t('welcome.getStarted')}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
          style={styles.createAccountButton}
          testID={'CreateAccountButton'}
          disabled={buttonsDisabled}
        />
        <Button
          onPress={onPressRestoreAccount}
          text={t('welcome.hasWallet')}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          testID={'RestoreAccountButton'}
          disabled={buttonsDisabled}
        />
      </View>
    </SafeAreaView>
  )
}

Welcome.navigationOptions = {
  ...nuxNavigationOptions,
  headerRight: () => <LanguageButton />,
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
    paddingHorizontal: Spacing.Thick24,
  },
  title: {
    ...typeScale.titleMedium,
    marginTop: Spacing.Smallest8,
    textAlign: 'center',
  },
  createAccountButton: {
    marginBottom: Spacing.Smallest8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.Regular16,
    paddingHorizontal: Spacing.Smallest8,
    gap: Spacing.Smallest8,
  },
  termsText: {
    color: colors.black,
    flexShrink: 1,
    ...typeScale.bodySmall,
  },
  termsTextLink: {
    textDecorationLine: 'underline',
  },
})
