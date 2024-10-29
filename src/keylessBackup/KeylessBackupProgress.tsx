import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { KeylessBackupEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import TokenDisplay from 'src/components/TokenDisplay'
import CustomHeader from 'src/components/header/CustomHeader'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import GreenLoadingSpinnerToCheck from 'src/icons/GreenLoadingSpinnerToCheck'
import Help from 'src/icons/Help'
import RedLoadingSpinnerToInfo from 'src/icons/RedLoadingSpinnerToInfo'
import { keylessBackupStatusSelector } from 'src/keylessBackup/selectors'
import { keylessBackupAcceptZeroBalance, keylessBackupBail } from 'src/keylessBackup/slice'
import {
  KeylessBackupFlow,
  KeylessBackupOrigin,
  KeylessBackupStatus,
} from 'src/keylessBackup/types'
import { useDollarsToLocalAmount, useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { ensurePincode, navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import {
  getOnboardingStepValues,
  goToNextOnboardingScreen,
  onboardingPropsSelector,
} from 'src/onboarding/steps'
import { totalPositionsBalanceUsdSelector } from 'src/positions/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTotalTokenBalance } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackup/KeylessBackupProgress'

function KeylessBackupProgress({
  route,
}: NativeStackScreenProps<StackParamList, Screens.KeylessBackupProgress>) {
  const { keylessBackupFlow, origin } = route.params

  // Disable back button on Android
  useEffect(() => {
    const backPressListener = () => true
    BackHandler.addEventListener('hardwareBackPress', backPressListener)
    return () => BackHandler.removeEventListener('hardwareBackPress', backPressListener)
  }, [])

  if (keylessBackupFlow === KeylessBackupFlow.Restore) {
    return <Restore />
  } else {
    return <Setup origin={origin} />
  }
}

function Restore() {
  const keylessBackupStatus = useSelector(keylessBackupStatusSelector)
  const localCurrencyCode = useLocalCurrencyCode()
  const onboardingProps = useSelector(onboardingPropsSelector)

  // TODO(ACT-1095): Update these to filter out unsupported networks once positions support non-Celo chains
  const totalTokenBalanceLocal = useTotalTokenBalance() ?? new BigNumber(0)
  const totalPositionsBalanceUsd = useSelector(totalPositionsBalanceUsdSelector)
  const totalPositionsBalanceLocal = useDollarsToLocalAmount(totalPositionsBalanceUsd)
  const totalBalanceLocal = totalTokenBalanceLocal?.plus(totalPositionsBalanceLocal ?? 0)

  const iconMarginTop = { marginTop: variables.height / 4 }

  const { t } = useTranslation()
  const dispatch = useDispatch()

  const onPressHelp = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_restore_failed_help)
    navigate(Screens.SupportContact)
  }

  const onPressTryAgain = () => {
    dispatch(keylessBackupBail())
    AppAnalytics.track(KeylessBackupEvents.cab_restore_failed_try_again, { keylessBackupStatus })
    navigate(Screens.ImportSelect)
  }

  const onPressCreateNewWallet = () => {
    dispatch(keylessBackupBail())
    AppAnalytics.track(KeylessBackupEvents.cab_restore_failed_create_new_wallet, {
      keylessBackupStatus,
    })
    navigate(Screens.Welcome)
  }

  switch (keylessBackupStatus) {
    case KeylessBackupStatus.InProgress: {
      return (
        <SafeAreaView style={styles.safeAreaView}>
          <ScrollView contentContainerStyle={styles.bodyContainer}>
            <View style={iconMarginTop}>
              <GreenLoadingSpinner />
            </View>
            <Text style={styles.title}>{t('keylessBackupStatus.restore.inProgress.title')}</Text>
          </ScrollView>
        </SafeAreaView>
      )
    }
    case KeylessBackupStatus.RestoreZeroBalance: {
      return (
        <SafeAreaView style={styles.safeAreaView}>
          <Dialog
            title={
              <Trans i18nKey="importExistingKey.emptyWalletDialog.title">
                <TokenDisplay
                  localAmount={{
                    value: new BigNumber(0),
                    currencyCode: localCurrencyCode,
                    exchangeRate: '1',
                  }}
                  showLocalAmount={true}
                  amount={new BigNumber(0)}
                />
              </Trans>
            }
            isVisible={true}
            actionText={t('importExistingKey.emptyWalletDialog.action')}
            actionPress={() => {
              AppAnalytics.track(KeylessBackupEvents.cab_restore_zero_balance_accept)
              dispatch(keylessBackupAcceptZeroBalance())
            }}
            secondaryActionText={t('goBack')}
            secondaryActionPress={() => {
              AppAnalytics.track(KeylessBackupEvents.cab_restore_zero_balance_bail)
              dispatch(keylessBackupBail())
            }}
            testID="ConfirmUseAccountDialog"
          >
            {t('importExistingKey.emptyWalletDialog.description')}
          </Dialog>
        </SafeAreaView>
      )
    }
    case KeylessBackupStatus.Completed: {
      return (
        <SafeAreaView style={styles.safeAreaView}>
          <ScrollView contentContainerStyle={styles.bodyContainer}>
            <View style={iconMarginTop}>
              <GreenLoadingSpinnerToCheck />
            </View>
            <Text style={styles.title}>{t('keylessBackupStatus.restore.completed.title')}</Text>
            <Text style={styles.body}>
              {totalBalanceLocal.gt(0) ? (
                <Trans i18nKey="keylessBackupStatus.restore.completed.bodyBalance">
                  <TokenDisplay
                    localAmount={{
                      value: totalBalanceLocal,
                      currencyCode: localCurrencyCode,
                      exchangeRate: '1',
                    }}
                    amount={0}
                  />
                </Trans>
              ) : (
                t('keylessBackupStatus.restore.completed.bodyZeroBalance')
              )}
            </Text>
          </ScrollView>
          <Button
            testID="KeylessBackupProgress/Continue"
            onPress={() => {
              AppAnalytics.track(KeylessBackupEvents.cab_restore_completed_continue)
              goToNextOnboardingScreen({
                onboardingProps,
                firstScreenInCurrentStep: Screens.ImportSelect,
              })
            }}
            text={t('continue')}
            touchableStyle={styles.buttonTouchable}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.FULL}
            style={styles.buttonContainerRestore}
          />
        </SafeAreaView>
      )
    }
    case KeylessBackupStatus.Failed:
      return (
        <SafeAreaView style={styles.safeAreaView}>
          <CustomHeader
            style={styles.header}
            right={
              <TopBarTextButton
                title={t('keylessBackupStatus.restore.failed.help')}
                testID="Header/KeylessBackupRestoreHelp"
                onPress={onPressHelp}
                titleStyle={styles.help}
              />
            }
          />
          <ScrollView contentContainerStyle={styles.bodyContainer}>
            <View style={iconMarginTop}>
              <RedLoadingSpinnerToInfo />
            </View>
            <Text style={styles.title}>{t('keylessBackupStatus.restore.failed.title')}</Text>
            <Text style={styles.body}>{t('keylessBackupStatus.restore.failed.body')}</Text>
          </ScrollView>
          <View style={styles.buttonContainerRestore}>
            <Button
              testID="KeylessBackupProgress/RestoreFailedTryAgain"
              onPress={onPressTryAgain}
              text={t('keylessBackupStatus.restore.failed.tryAgain')}
              size={BtnSizes.FULL}
              type={BtnTypes.PRIMARY}
              touchableStyle={styles.buttonTouchable}
            />
            <Button
              testID="KeylessBackupProgress/RestoreFailedCreateNewWallet"
              onPress={onPressCreateNewWallet}
              text={t('keylessBackupStatus.restore.failed.createNewWallet')}
              size={BtnSizes.FULL}
              type={BtnTypes.SECONDARY}
              touchableStyle={styles.buttonTouchable}
            />
          </View>
        </SafeAreaView>
      )
    case KeylessBackupStatus.NotFound:
      return (
        <SafeAreaView style={styles.safeAreaView}>
          <ScrollView contentContainerStyle={styles.bodyContainer}>
            <View style={iconMarginTop}>
              <Help size={60} color={colors.gray4} />
            </View>
            <Text style={styles.title}>{t('keylessBackupStatus.restore.notFound.title')}</Text>
            <Text style={styles.body}>
              <Trans i18nKey={'keylessBackupStatus.restore.notFound.body'}>
                <Text style={styles.bold} />
              </Trans>
            </Text>
          </ScrollView>
          <View style={styles.buttonContainerRestore}>
            <Button
              testID="KeylessBackupProgress/RestoreNotFoundTryAgain"
              onPress={onPressTryAgain}
              text={t('keylessBackupStatus.restore.notFound.tryAgain')}
              size={BtnSizes.FULL}
              type={BtnTypes.PRIMARY}
              touchableStyle={styles.buttonTouchable}
            />
            <Button
              testID="KeylessBackupProgress/RestoreNotFoundCreateNewWallet"
              onPress={onPressCreateNewWallet}
              text={t('keylessBackupStatus.restore.notFound.createNewWallet')}
              size={BtnSizes.FULL}
              type={BtnTypes.SECONDARY}
              touchableStyle={styles.buttonTouchable}
            />
          </View>
        </SafeAreaView>
      )
    default:
      Logger.error(TAG, `Got unexpected keyless backup status: ${keylessBackupStatus}`)
      return <></>
  }
}

function KeylessBackupSetupContainer({
  isOnboarding,
  title,
  subtitle,
  children,
}: {
  isOnboarding: boolean
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <SafeAreaView style={styles.safeAreaView}>
      {isOnboarding && (
        <CustomHeader
          title={<HeaderTitleWithSubtitle title={title} subTitle={subtitle} />}
          style={styles.header}
        />
      )}
      {children}
    </SafeAreaView>
  )
}

function Setup({ origin }: { origin: KeylessBackupOrigin }) {
  const keylessBackupStatus = useSelector(keylessBackupStatusSelector)
  const onboardingProps = useSelector(onboardingPropsSelector)
  const { step, totalSteps } = getOnboardingStepValues(Screens.SignInWithEmail, onboardingProps)
  const { t } = useTranslation()
  const { bottom } = useSafeAreaInsets()
  const insetsStyle = {
    paddingBottom: Math.max(0, 40 - bottom),
  }

  const isOnboarding = origin === KeylessBackupOrigin.Onboarding

  const onPressContinue = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_progress_completed_continue, { origin })
    isOnboarding
      ? goToNextOnboardingScreen({
          onboardingProps,
          firstScreenInCurrentStep: Screens.SignInWithEmail,
        })
      : navigateHome()
  }

  const iconMarginTop = { marginTop: variables.height / 4 }

  const onPressManual = async () => {
    AppAnalytics.track(KeylessBackupEvents.cab_progress_failed_manual, { origin })
    try {
      const pinIsCorrect = await ensurePincode()
      if (pinIsCorrect) {
        navigate(Screens.BackupIntroduction)
      }
    } catch (error) {
      Logger.error(TAG, 'PIN ensure error', error)
    }
  }

  const onPressLater = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_progress_failed_later)
    navigate(Screens.SecuritySubmenu)
  }

  const onPressManualOnboarding = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_progress_failed_manual, { origin })
    navigate(Screens.AccountKeyEducation, { origin: 'cabOnboarding' })
  }

  const onPressSkip = () => {
    AppAnalytics.track(KeylessBackupEvents.cab_progress_failed_skip_onboarding)
    navigate(Screens.ChooseYourAdventure)
  }

  switch (keylessBackupStatus) {
    case KeylessBackupStatus.InProgress: {
      return (
        <KeylessBackupSetupContainer
          isOnboarding={isOnboarding}
          title={t('keylessBackupStatus.setup.inProgress.title')}
          subtitle={t('registrationSteps', { step, totalSteps })}
        >
          <ScrollView contentContainerStyle={styles.bodyContainer}>
            <View style={iconMarginTop}>
              <GreenLoadingSpinner />
            </View>
            {!isOnboarding && (
              <Text style={styles.title}>{t('keylessBackupStatus.setup.inProgress.title')}</Text>
            )}
          </ScrollView>
        </KeylessBackupSetupContainer>
      )
    }
    case KeylessBackupStatus.Completed: {
      return (
        <KeylessBackupSetupContainer
          isOnboarding={isOnboarding}
          title={t('keylessBackupStatus.setup.completed.title')}
          subtitle={t('registrationSteps', { step, totalSteps })}
        >
          <ScrollView contentContainerStyle={styles.bodyContainer}>
            <View style={iconMarginTop}>
              <GreenLoadingSpinnerToCheck />
            </View>
            {!isOnboarding && (
              <Text style={styles.title}>{t('keylessBackupStatus.setup.completed.title')}</Text>
            )}
            <Text style={styles.body}>{t('keylessBackupStatus.setup.completed.body')}</Text>
          </ScrollView>
          <Button
            testID="KeylessBackupProgress/Continue"
            onPress={onPressContinue}
            text={t('continue')}
            size={BtnSizes.FULL}
            type={BtnTypes.PRIMARY}
            touchableStyle={styles.buttonTouchable}
            style={[styles.buttonContainer, insetsStyle]}
          />
        </KeylessBackupSetupContainer>
      )
    }
    case KeylessBackupStatus.Failed: {
      return (
        <KeylessBackupSetupContainer
          isOnboarding={isOnboarding}
          title={t('keylessBackupStatus.setup.failed.title')}
          subtitle={t('registrationSteps', { step, totalSteps })}
        >
          <ScrollView contentContainerStyle={styles.bodyContainer}>
            <View style={iconMarginTop}>
              <RedLoadingSpinnerToInfo />
            </View>
            {!isOnboarding && (
              <Text style={styles.title}>{t('keylessBackupStatus.setup.failed.title')}</Text>
            )}
            <Text style={styles.body}>{t('keylessBackupStatus.setup.failed.body')}</Text>
          </ScrollView>
          <View style={[styles.buttonContainer, insetsStyle]}>
            <Button
              testID={
                isOnboarding
                  ? 'KeylessBackupProgress/ManualOnboarding'
                  : 'KeylessBackupProgress/Later'
              }
              onPress={isOnboarding ? onPressManualOnboarding : onPressLater}
              text={t(
                isOnboarding
                  ? 'keylessBackupStatus.setup.failed.manual'
                  : 'keylessBackupStatus.setup.failed.later'
              )}
              size={BtnSizes.FULL}
              type={BtnTypes.PRIMARY}
            />
            <Button
              testID={isOnboarding ? 'KeylessBackupProgress/Skip' : 'KeylessBackupProgress/Manual'}
              onPress={isOnboarding ? onPressSkip : onPressManual}
              text={t(
                isOnboarding
                  ? 'keylessBackupStatus.setup.failed.skip'
                  : 'keylessBackupStatus.setup.failed.manual'
              )}
              size={BtnSizes.FULL}
              type={BtnTypes.SECONDARY}
            />
          </View>
        </KeylessBackupSetupContainer>
      )
    }
    default:
      Logger.error(TAG, `Got unexpected keyless backup status: ${keylessBackupStatus}`)
      return <></>
  }
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: '700',
  },
  safeAreaView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: variables.contentPadding,
  },
  bodyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: Spacing.Thick24,
  },
  title: {
    ...typeScale.labelSemiBoldLarge,
    paddingTop: Spacing.Regular16,
    textAlign: 'center',
  },
  body: {
    ...typeScale.bodyMedium,
    paddingTop: Spacing.Regular16,
    textAlign: 'center',
    marginBottom: Spacing.Regular16,
  },
  buttonContainer: {
    gap: Spacing.Smallest8,
    marginHorizontal: Spacing.Thick24,
  },
  buttonContainerRestore: {
    gap: Spacing.Smallest8,
    marginHorizontal: Spacing.Thick24,
    marginBottom: Spacing.Thick24,
  },
  buttonTouchable: {
    justifyContent: 'center',
  },
  help: {
    color: colors.accent,
    ...typeScale.labelSemiBoldMedium,
  },
})

export default KeylessBackupProgress
