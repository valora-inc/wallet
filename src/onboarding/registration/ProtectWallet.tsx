import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { recoveryPhraseInOnboardingStarted } from 'src/account/actions'
import { RecoveryPhraseInOnboardingStatus } from 'src/account/reducer'
import { recoveryPhraseInOnboardingStatusSelector } from 'src/account/selectors'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import OnboardingCard from 'src/components/OnboardingCard'
import GuideKeyIcon from 'src/icons/GuideKeyIcon'
import { HeaderTitleWithSubtitle, nuxNavigationOptionsOnboarding } from 'src/navigator/Headers'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getOnboardingStepValues, onboardingPropsSelector } from 'src/onboarding/steps'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'ProtectWallet'

type Props = NativeStackScreenProps<StackParamList, Screens.ProtectWallet>

function ProtectWallet({ navigation }: Props) {
  const onboardingProps = useSelector(onboardingPropsSelector)
  const { step, totalSteps } = getOnboardingStepValues(Screens.ProtectWallet, onboardingProps)
  const address = useSelector(walletAddressSelector)
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const recoveryPhraseInOnboardingStatus = useSelector(recoveryPhraseInOnboardingStatusSelector)

  const navigateToRecoveryPhrase = () => {
    ensurePincode()
      .then((pinIsCorrect) => {
        if (pinIsCorrect) {
          navigate(Screens.OnboardingRecoveryPhrase)
        }
      })
      .catch((error) => {
        Logger.error(TAG, 'PIN ensure error', error)
      })
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        return (
          <HeaderTitleWithSubtitle
            title={t('protectWallet.title')}
            subTitle={t('registrationSteps', { step, totalSteps })}
          />
        )
      },
      headerLeft: undefined,
    })
  }, [navigation, step, totalSteps])

  useEffect(() => {
    if (recoveryPhraseInOnboardingStatus === RecoveryPhraseInOnboardingStatus.NotStarted) {
      dispatch(recoveryPhraseInOnboardingStarted())
    }
  })

  const onPressRecoveryPhrase = () => {
    ValoraAnalytics.track(OnboardingEvents.protect_wallet_use_recovery)
    navigateToRecoveryPhrase()
  }

  if (!address) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator testID="loadingTransferStatus" size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.topSection}>
          <View style={styles.iconContainer}>
            <GuideKeyIcon />
          </View>
          <Text style={styles.protectWalletTitle}>{t('protectWallet.subtitle')}</Text>
          <Text style={styles.protectWalletBody}>{t('protectWallet.body')}</Text>
        </View>
        <View style={styles.cardSection}>
          <OnboardingCard
            testId={'recoveryPhraseCard'}
            key={'recoveryPhraseCard'}
            title={t('protectWallet.recoveryPhrase.title')}
            subtitle={t('protectWallet.recoveryPhrase.subtitle')}
            onPress={onPressRecoveryPhrase}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

ProtectWallet.navOptions = nuxNavigationOptionsOnboarding

export default ProtectWallet

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  cardSection: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    width: '100%',
    padding: 20,
  },
  topSection: {
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  contentContainer: {
    justifyContent: 'flex-start',
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  iconContainer: {
    paddingTop: 40,
  },
  protectWalletBody: {
    textAlign: 'center',
    marginTop: 16,
    ...fontStyles.regular,
  },
  protectWalletTitle: {
    textAlign: 'center',
    marginTop: 36,
    ...fontStyles.h1,
  },
})
