import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { acceptTerms, chooseCreateAccount, chooseRestoreAccount } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CheckBox from 'src/icons/CheckBox'
import { welcomeBackground } from 'src/images/Images'
import WelcomeLogo from 'src/images/WelcomeLogo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import LanguageButton from 'src/onboarding/LanguageButton'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getDynamicConfigParams, getExperimentParams, patchUpdateStatsigUser } from 'src/statsig'
import { DynamicConfigs, ExperimentConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigExperiments } from 'src/statsig/types'
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
        AppAnalytics.track(OnboardingEvents.terms_and_conditions_accepted)
        dispatch(acceptTerms())
      }
      startOnboarding()
    }
  }

  const onPressCreateAccount = async () => {
    AppAnalytics.track(OnboardingEvents.create_account_start)
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
    AppAnalytics.track(OnboardingEvents.restore_account_start)
    dispatch(chooseRestoreAccount())
    navigateNext()
  }

  const onPressTerms = () => {
    const { links } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])
    navigateToURI(links.tos)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={welcomeBackground} resizeMode="stretch" style={styles.image}>
        <View style={styles.contentContainer}>
          <WelcomeLogo />
        </View>
        <View style={{ ...styles.buttonView, marginBottom: Math.max(0, 40 - insets.bottom) }}>
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
            text={t('welcome.createNewWallet')}
            size={BtnSizes.FULL}
            type={BtnTypes.PRIMARY}
            style={styles.createAccountButton}
            testID={'CreateAccountButton'}
            disabled={buttonsDisabled}
          />
          <Button
            onPress={onPressRestoreAccount}
            text={t('welcome.hasWalletV1_88')}
            size={BtnSizes.FULL}
            type={BtnTypes.SECONDARY}
            testID={'RestoreAccountButton'}
            disabled={buttonsDisabled}
          />
        </View>
      </ImageBackground>
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
  buttonView: {
    paddingHorizontal: Spacing.Thick24,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
    marginTop: Spacing.XLarge48,
  },
})
