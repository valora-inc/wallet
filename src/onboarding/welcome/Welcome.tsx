import React from 'react'
import { useTranslation } from 'react-i18next'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { chooseCreateAccount, chooseRestoreAccount } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { welcomeBackground } from 'src/images/Images'
import WelcomeLogo from 'src/images/WelcomeLogo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import LanguageButton from 'src/onboarding/LanguageButton'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { patchUpdateStatsigUser } from 'src/statsig'
import { Spacing } from 'src/styles/styles'

export default function Welcome() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const acceptedTerms = useSelector((state) => state.account.acceptedTerms)
  const startOnboardingTime = useSelector((state) => state.account.startOnboardingTime)
  const insets = useSafeAreaInsets()
  const recoveringFromStoreWipe = useSelector(recoveringFromStoreWipeSelector)

  const startOnboarding = () => {
    navigate(
      firstOnboardingScreen({
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

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={welcomeBackground} resizeMode="stretch" style={styles.image}>
        <View style={styles.contentContainer}>
          <WelcomeLogo />
        </View>
        <View style={{ ...styles.buttonView, marginBottom: Math.max(0, 40 - insets.bottom) }}>
          <Button
            onPress={onPressCreateAccount}
            text={t('welcome.createNewWallet')}
            size={BtnSizes.FULL}
            type={BtnTypes.PRIMARY}
            style={styles.createAccountButton}
            testID={'CreateAccountButton'}
          />
          <Button
            onPress={onPressRestoreAccount}
            text={t('welcome.hasWalletV1_88')}
            size={BtnSizes.FULL}
            type={BtnTypes.SECONDARY}
            testID={'RestoreAccountButton'}
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
  buttonView: {
    paddingHorizontal: Spacing.Thick24,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
    marginTop: Spacing.XLarge48,
  },
})
