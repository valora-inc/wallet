import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useLayoutEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import TokenDisplay from 'src/components/TokenDisplay'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import GreenLoadingSpinnerToCheck from 'src/icons/GreenLoadingSpinnerToCheck'
import { Help } from 'src/icons/Help'
import RedLoadingSpinnerToInfo from 'src/icons/RedLoadingSpinnerToInfo'
import { keylessBackupStatusSelector } from 'src/keylessBackup/selectors'
import { keylessBackupAcceptZeroBalance, keylessBackupBail } from 'src/keylessBackup/slice'
import {
  KeylessBackupFlow,
  KeylessBackupOrigin,
  KeylessBackupStatus,
} from 'src/keylessBackup/types'
import { useDollarsToLocalAmount, useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { ensurePincode, navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { goToNextOnboardingScreen, onboardingPropsSelector } from 'src/onboarding/steps'
import { totalPositionsBalanceUsdSelector } from 'src/positions/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTotalTokenBalance } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackup/KeylessBackupProgress'

function KeylessBackupProgress({
  route,
  navigation,
}: NativeStackScreenProps<StackParamList, Screens.KeylessBackupProgress>) {
  const keylessBackupStatus = useSelector(keylessBackupStatusSelector)
  const { t } = useTranslation()
  const { keylessBackupFlow, origin } = route.params

  const onPressHelp = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_restore_failed_help)
    navigate(Screens.SupportContact)
  }

  // Disable back button on Android
  useEffect(() => {
    const backPressListener = () => true
    BackHandler.addEventListener('hardwareBackPress', backPressListener)
    return () => BackHandler.removeEventListener('hardwareBackPress', backPressListener)
  }, [])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        keylessBackupStatus === KeylessBackupStatus.Failed &&
        keylessBackupFlow === KeylessBackupFlow.Restore && (
          <TopBarTextButton
            title={t('keylessBackupStatus.restore.failed.help')}
            testID="KeylessBackupRestoreHelp"
            onPress={onPressHelp}
            titleStyle={styles.help}
          />
        ),
    })
  })

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

  const { t } = useTranslation()
  const dispatch = useDispatch()

  const onPressTryAgain = () => {
    dispatch(keylessBackupBail())
    ValoraAnalytics.track(KeylessBackupEvents.cab_restore_failed_try_again, { keylessBackupStatus })
    navigate(Screens.ImportSelect)
  }

  const onPressCreateNewWallet = () => {
    dispatch(keylessBackupBail())
    ValoraAnalytics.track(KeylessBackupEvents.cab_restore_failed_create_new_wallet, {
      keylessBackupStatus,
    })
    navigate(Screens.Welcome)
  }

  switch (keylessBackupStatus) {
    case KeylessBackupStatus.InProgress: {
      return renderInProgressState(t('keylessBackupStatus.restore.inProgress.title'))
    }
    case KeylessBackupStatus.RestoreZeroBalance: {
      return (
        <SafeAreaView>
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
              ValoraAnalytics.track(KeylessBackupEvents.cab_restore_zero_balance_accept)
              dispatch(keylessBackupAcceptZeroBalance())
            }}
            secondaryActionText={t('goBack')}
            secondaryActionPress={() => {
              ValoraAnalytics.track(KeylessBackupEvents.cab_restore_zero_balance_bail)
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
        <SafeAreaView style={styles.container}>
          <View style={styles.finishedContainer}>
            <View style={styles.iconContainer}>
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
          </View>

          <Button
            testID="KeylessBackupProgress/Continue"
            onPress={() => {
              ValoraAnalytics.track(KeylessBackupEvents.cab_restore_completed_continue)
              goToNextOnboardingScreen({
                onboardingProps,
                firstScreenInCurrentStep: Screens.ImportSelect,
              })
            }}
            text={t('continue')}
            style={styles.button}
            touchableStyle={styles.buttonTouchable}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.FULL}
          />
        </SafeAreaView>
      )
    }
    case KeylessBackupStatus.Failed:
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.finishedContainer}>
            <RedLoadingSpinnerToInfo />
            <Text style={styles.title}>{t('keylessBackupStatus.restore.failed.title')}</Text>
            <Text style={styles.body}>{t('keylessBackupStatus.restore.failed.body')}</Text>
          </View>
          <Button
            testID="KeylessBackupProgress/RestoreFailedTryAgain"
            onPress={onPressTryAgain}
            text={t('keylessBackupStatus.restore.failed.tryAgain')}
            size={BtnSizes.FULL}
            type={BtnTypes.PRIMARY}
            style={styles.button}
            touchableStyle={styles.buttonTouchable}
          />
          <Button
            testID="KeylessBackupProgress/RestoreFailedCreateNewWallet"
            onPress={onPressCreateNewWallet}
            text={t('keylessBackupStatus.restore.failed.createNewWallet')}
            size={BtnSizes.FULL}
            type={BtnTypes.SECONDARY}
            style={styles.button}
            touchableStyle={styles.buttonTouchable}
          />
        </SafeAreaView>
      )
    case KeylessBackupStatus.NotFound:
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.finishedContainer}>
            <Help size={60} color={colors.gray4} />
            <Text style={styles.title}>{t('keylessBackupStatus.restore.notFound.title')}</Text>
            <Text style={styles.body}>
              <Trans i18nKey={'keylessBackupStatus.restore.notFound.body'}>
                <Text style={styles.bold} />
              </Trans>
            </Text>
          </ScrollView>
          <Button
            testID="KeylessBackupProgress/RestoreNotFoundTryAgain"
            onPress={onPressTryAgain}
            text={t('keylessBackupStatus.restore.notFound.tryAgain')}
            size={BtnSizes.FULL}
            type={BtnTypes.PRIMARY}
            style={styles.button}
            touchableStyle={styles.buttonTouchable}
          />
          <Button
            testID="KeylessBackupProgress/RestoreNotFoundCreateNewWallet"
            onPress={onPressCreateNewWallet}
            text={t('keylessBackupStatus.restore.notFound.createNewWallet')}
            size={BtnSizes.FULL}
            type={BtnTypes.SECONDARY}
            style={styles.button}
            touchableStyle={styles.buttonTouchable}
          />
        </SafeAreaView>
      )
    default:
      Logger.error(TAG, `Got unexpected keyless backup status: ${keylessBackupStatus}`)
      return <></>
  }
}

function Setup({ origin }: { origin: KeylessBackupOrigin }) {
  const keylessBackupStatus = useSelector(keylessBackupStatusSelector)
  const { t } = useTranslation()

  const navigatedFromSettings = origin === KeylessBackupOrigin.Settings

  const onPressContinue = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_progress_completed_continue)
    navigateHome()
  }

  const onPressManual = async () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_progress_failed_manual, { origin })
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
    ValoraAnalytics.track(KeylessBackupEvents.cab_progress_failed_later)
    navigate(Screens.Settings)
  }

  const onPressManualOnboarding = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_progress_failed_manual, { origin })
    navigate(Screens.AccountKeyEducation)
  }

  const onPressSkip = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_progress_failed_skip_onboarding)
    navigate(Screens.ChooseYourAdventure)
  }

  switch (keylessBackupStatus) {
    case KeylessBackupStatus.InProgress: {
      return renderInProgressState(t('keylessBackupStatus.setup.inProgress.title'))
    }
    case KeylessBackupStatus.Completed: {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.finishedContainer}>
            <View style={styles.iconContainer}>
              <GreenLoadingSpinnerToCheck />
            </View>
            <Text style={styles.title}>{t('keylessBackupStatus.setup.completed.title')}</Text>
            <Text style={styles.body}>{t('keylessBackupStatus.setup.completed.body')}</Text>
          </View>
          <Button
            testID="KeylessBackupProgress/Continue"
            onPress={onPressContinue}
            text={t('continue')}
            size={BtnSizes.FULL}
            type={BtnTypes.PRIMARY}
            style={styles.button}
            touchableStyle={styles.buttonTouchable}
          />
        </SafeAreaView>
      )
    }
    case KeylessBackupStatus.Failed: {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.finishedContainer}>
            <RedLoadingSpinnerToInfo />
            <Text style={styles.title}>{t('keylessBackupStatus.setup.failed.title')}</Text>
            <Text style={styles.body}>{t('keylessBackupStatus.setup.failed.body')}</Text>
          </View>
          <Button
            testID={
              navigatedFromSettings
                ? 'KeylessBackupProgress/Later'
                : 'KeylessBackupProgress/ManualOnboarding'
            }
            onPress={navigatedFromSettings ? onPressLater : onPressManualOnboarding}
            text={t(
              navigatedFromSettings
                ? 'keylessBackupStatus.setup.failed.later'
                : 'keylessBackupStatus.setup.failed.manual'
            )}
            size={BtnSizes.FULL}
            type={BtnTypes.PRIMARY}
            style={styles.button}
            touchableStyle={styles.buttonTouchable}
          />
          <Button
            testID={
              navigatedFromSettings ? 'KeylessBackupProgress/Manual' : 'KeylessBackupProgress/Skip'
            }
            onPress={navigatedFromSettings ? onPressManual : onPressSkip}
            text={t(
              navigatedFromSettings
                ? 'keylessBackupStatus.setup.failed.manual'
                : 'keylessBackupStatus.setup.failed.skip'
            )}
            size={BtnSizes.FULL}
            type={BtnTypes.SECONDARY}
            style={styles.button}
            touchableStyle={styles.buttonTouchable}
          />
        </SafeAreaView>
      )
    }
    default:
      Logger.error(TAG, `Got unexpected keyless backup status: ${keylessBackupStatus}`)
      return <></>
  }
}

function renderInProgressState(title: string) {
  return (
    <SafeAreaView style={styles.progressContainer}>
      <GreenLoadingSpinner />
      <Text style={styles.title}>{title}</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  iconContainer: {},
  bold: {
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexGrow: 1,
    marginHorizontal: Spacing.Thick24,
  },
  finishedContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  button: {
    paddingVertical: Spacing.Smallest8,
  },
  buttonTouchable: {
    justifyContent: 'center',
  },
  help: {
    color: colors.primary,
    ...typeScale.labelSemiBoldMedium,
  },
})

export default KeylessBackupProgress
