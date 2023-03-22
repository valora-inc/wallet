import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { chooseCreateAccount, chooseRestoreAccount } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Logo, { LogoTypes } from 'src/icons/Logo'
import { welcomeBackground } from 'src/images/Images'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import LanguageButton from 'src/onboarding/LanguageButton'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import { default as useSelector } from 'src/redux/useSelector'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { Statsig } from 'statsig-react-native'
import Logger from 'src/utils/Logger'

const TAG = 'Welcome'

export default function Welcome() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const acceptedTerms = useSelector((state) => state.account.acceptedTerms)
  const startOnboardingTime = useSelector((state) => state.account.startOnboardingTime)
  const insets = useSafeAreaInsets()
  const recoveringFromStoreWipe = useSelector(recoveringFromStoreWipeSelector)

  const startOnboarding = () => {
    const { onboardingNameScreenEnabled } = getExperimentParams(
      ExperimentConfigs[StatsigExperiments.CHOOSE_YOUR_ADVENTURE]
    )
    navigate(
      firstOnboardingScreen({
        onboardingNameScreenEnabled,
        recoveringFromStoreWipe,
      })
    )
  }

  const navigateNext = () => {
    if (!acceptedTerms) {
      navigate(Screens.RegulatoryTerms)
    } else {
      startOnboarding()
    }
  }

  const onPressCreateAccount = async () => {
    ValoraAnalytics.track(OnboardingEvents.create_account_start)
    const now = Date.now()
    if (startOnboardingTime === undefined) {
      // this is the user's first time selecting 'create account' on this device
      try {
        // this lets us restrict some onboarding experiments to only users who begin onboarding
        //  after the experiment begins
        await Statsig.updateUser({ custom: { startOnboardingTime: now } })
      } catch (error) {
        Logger.error(TAG, 'Failed to update Statsig user with startOnboardingTimestamp', error)
      }
    }
    dispatch(chooseCreateAccount(now))
    navigateNext()
  }

  const onPressRestoreAccount = () => {
    ValoraAnalytics.track(OnboardingEvents.restore_account_start)
    dispatch(chooseRestoreAccount())
    navigateNext()
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image source={welcomeBackground} style={styles.backgroundImage} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Logo type={LogoTypes.COLOR} height={64} />
        <Text style={styles.title} testID={'WelcomeText'}>
          {t('welcome.header')}
        </Text>
      </ScrollView>
      <View style={{ marginBottom: Math.max(0, 40 - insets.bottom) }}>
        <Button
          onPress={onPressCreateAccount}
          text={t('welcome.getStarted')}
          size={BtnSizes.FULL}
          type={BtnTypes.ONBOARDING}
          style={styles.createAccountButton}
          testID={'CreateAccountButton'}
        />
        <Button
          onPress={onPressRestoreAccount}
          text={t('welcome.hasWallet')}
          size={BtnSizes.FULL}
          type={BtnTypes.ONBOARDING_SECONDARY}
          testID={'RestoreAccountButton'}
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
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  title: {
    ...fontStyles.h1,
    fontSize: 32,
    lineHeight: 40,
    marginTop: Spacing.Smallest8,
    textAlign: 'center',
  },
  createAccountButton: {
    marginBottom: Spacing.Smallest8,
  },
})
