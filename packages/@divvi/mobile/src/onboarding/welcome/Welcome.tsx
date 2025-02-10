import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { chooseCreateAccount, chooseRestoreAccount } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import { getAppConfig } from 'src/appConfig'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DivviLogo from 'src/images/DivviLogo'
import { welcomeBackground } from 'src/images/Images'
import WelcomeLogo from 'src/images/WelcomeLogo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import LanguageButton from 'src/onboarding/LanguageButton'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getDynamicConfigParams, patchUpdateStatsigUser } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { Spacing } from 'src/styles/styles'
import { demoModeToggled } from 'src/web3/actions'
import { demoModeEnabledSelector } from 'src/web3/selectors'

const DEMO_MODE_LONG_PRESS_DELAY_MS = 4_000

export default function Welcome() {
  const demoModeBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const { t } = useTranslation()
  const dispatch = useDispatch()
  const acceptedTerms = useSelector((state) => state.account.acceptedTerms)
  const startOnboardingTime = useSelector((state) => state.account.startOnboardingTime)
  const insets = useSafeAreaInsets()
  const recoveringFromStoreWipe = useSelector(recoveringFromStoreWipeSelector)
  const demoModeEnabled = useSelector(demoModeEnabledSelector)

  const { enabledInOnboarding } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.DEMO_MODE_CONFIG]
  )

  useEffect(() => {
    if (demoModeEnabled) {
      navigateHome()
    }
  }, [demoModeEnabled])

  const onActivateDemoMode = () => {
    dispatch(demoModeToggled(true))
  }

  const onRequestActivateDemoMode = () => {
    demoModeBottomSheetRef.current?.snapToIndex(0)
  }

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

  const assetsConfig = getAppConfig().themes?.default?.assets

  const Logo = assetsConfig?.welcomeLogo ?? WelcomeLogo
  const backgroundImage =
    assetsConfig && 'welcomeBackgroundImage' in assetsConfig
      ? assetsConfig.welcomeBackgroundImage
      : welcomeBackground

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={backgroundImage} resizeMode="stretch" style={styles.image}>
        <View style={styles.contentContainer}>
          <TouchableWithoutFeedback
            disabled={!enabledInOnboarding}
            delayLongPress={DEMO_MODE_LONG_PRESS_DELAY_MS}
            onLongPress={onRequestActivateDemoMode}
            testID="Welcome/RequestActivateDemoMode"
          >
            <Logo />
          </TouchableWithoutFeedback>
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
        <View style={styles.divviLogoContainer}>
          <DivviLogo />
        </View>
      </ImageBackground>
      <BottomSheet
        forwardedRef={demoModeBottomSheetRef}
        title={t('demoMode.confirmEnter.title')}
        description={t('demoMode.confirmEnter.info')}
      >
        <Button
          onPress={onActivateDemoMode}
          text={t('demoMode.confirmEnter.cta')}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
          style={styles.demoModeButton}
        />
      </BottomSheet>
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
  divviLogoContainer: {
    width: '100%',
    marginTop: Spacing.Large32,
    paddingBottom: Spacing.Regular16,
    alignItems: 'center',
  },
  demoModeButton: {
    marginTop: Spacing.Thick24,
  },
})
