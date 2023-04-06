import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import seedrandom from 'seedrandom'
import { recoveryPhraseInOnboardingSeen } from 'src/account/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import OnboardingCard from 'src/components/OnboardingCard'
import GuideKeyIcon from 'src/icons/GuideKeyIcon'
import { HeaderTitleWithSubtitle, nuxNavigationOptionsOnboarding } from 'src/navigator/Headers'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getOnboardingStepValues, onboardingPropsSelector } from 'src/onboarding/steps'
import { default as useTypedSelector } from 'src/redux/useSelector'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { twelveWordMnemonicEnabledSelector, walletAddressSelector } from 'src/web3/selectors'

const TAG = 'ProtectWallet'

type Props = NativeStackScreenProps<StackParamList, Screens.ProtectWallet>

function getCloudBackupIndex(seed: string | null) {
  if (!seed) {
    return 1
  } else {
    return seedrandom(seed)() > 0.5 ? 0 : 1
  }
}

function ProtectWallet({ navigation }: Props) {
  const twelveWordMnemonicEnabled = useSelector(twelveWordMnemonicEnabledSelector)
  const mnemonicLength = twelveWordMnemonicEnabled ? '12' : '24'
  const onboardingProps = useTypedSelector(onboardingPropsSelector)
  const { showCloudBackupFakeDoor } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING]
  )
  const { step, totalSteps } = getOnboardingStepValues(Screens.ProtectWallet, onboardingProps)
  const address = useSelector(walletAddressSelector)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const cloudBackupIndex = getCloudBackupIndex(address)

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
    dispatch(recoveryPhraseInOnboardingSeen())
  })

  const onPressRecoveryPhrase = () => {
    ValoraAnalytics.track(OnboardingEvents.protect_wallet_use_recovery, {
      position: showCloudBackupFakeDoor ? 1 - cloudBackupIndex : undefined,
    })
    navigateToRecoveryPhrase()
  }
  const onPressCloudBackup = () => {
    ValoraAnalytics.track(OnboardingEvents.protect_wallet_use_cloud, {
      position: cloudBackupIndex,
    })
    setShowBottomSheet(true)
  }
  const onPressContinueBottomSheet = () => {
    ValoraAnalytics.track(OnboardingEvents.protect_wallet_use_cloud_bottom_sheet)
    navigateToRecoveryPhrase()
    setShowBottomSheet(false)
  }
  const onPressDismissBottomSheet = () => {
    setShowBottomSheet(false)
  }

  const getCardSection = () => {
    const recoveryPhraseCard = (
      <OnboardingCard
        testId={'recoveryPhraseCard'}
        key={'recoveryPhraseCard'}
        title={t('protectWallet.recoveryPhrase.title')}
        subtitle={t('protectWallet.recoveryPhrase.subtitle')}
        onPress={onPressRecoveryPhrase}
      />
    )
    if (showCloudBackupFakeDoor) {
      const cloudBackupCard = (
        <OnboardingCard
          testId={'cloudBackupCard'}
          key={'cloudBackupCard'}
          title={t('protectWallet.cloudBackup.title')}
          subtitle={t('protectWallet.cloudBackup.subtitle')}
          onPress={onPressCloudBackup}
        />
      )
      return cloudBackupIndex === 0
        ? [cloudBackupCard, recoveryPhraseCard]
        : [recoveryPhraseCard, cloudBackupCard]
    } else {
      return [recoveryPhraseCard]
    }
  }

  if (!address) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator
            testID="loadingTransferStatus"
            size="large"
            color={colors.greenBrand}
          />
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
          <Text style={styles.protectWalletBody}>
            {t('protectWallet.body', { mnemonicLength })}
          </Text>
        </View>
        <View style={styles.cardSection}>{getCardSection()}</View>
      </ScrollView>
      <BottomSheet
        testID="protectWalletBottomSheet"
        isVisible={showBottomSheet}
        onBackgroundPress={onPressDismissBottomSheet}
      >
        <View>
          <Text style={styles.bottomSheetTitle}>
            {t('protectWallet.cloudBackup.bottomSheet.title')}
          </Text>
          <Text style={styles.bottomSheetBody}>
            {t('protectWallet.cloudBackup.bottomSheet.restoreComingSoon')}
          </Text>
          <Text style={styles.bottomSheetBody}>
            {t('protectWallet.cloudBackup.bottomSheet.writeDownPhrase')}
          </Text>

          <Button
            style={styles.buttonStyle}
            onPress={onPressContinueBottomSheet}
            text={t('protectWallet.cloudBackup.bottomSheet.continue')}
            size={BtnSizes.FULL}
            type={BtnTypes.ONBOARDING}
            testID={'protectWalletBottomSheetContinue'}
          />
        </View>
      </BottomSheet>
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
  buttonStyle: {
    paddingTop: 30,
  },
  bottomSheetTitle: {
    ...fontStyles.h2,
  },
  bottomSheetBody: {
    ...fontStyles.regular,
    marginTop: 12,
    paddingBottom: 10,
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
