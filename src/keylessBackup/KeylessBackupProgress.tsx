import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BackHandler, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import TokenDisplay from 'src/components/TokenDisplay'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import GreenLoadingSpinnerToCheck from 'src/icons/GreenLoadingSpinnerToCheck'
import RedLoadingSpinnerToInfo from 'src/icons/RedLoadingSpinnerToInfo'
import { keylessBackupStatusSelector } from 'src/keylessBackup/selectors'
import { keylessBackupAcceptZeroBalance, keylessBackupBail } from 'src/keylessBackup/slice'
import { KeylessBackupFlow, KeylessBackupStatus } from 'src/keylessBackup/types'
import { ensurePincode, navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import { Currency } from 'src/utils/currencies'

const TAG = 'keylessBackup/KeylessBackupProgress'

function KeylessBackupProgress({
  route,
}: NativeStackScreenProps<StackParamList, Screens.KeylessBackupProgress>) {
  const keylessBackupStatus = useSelector(keylessBackupStatusSelector)

  const { t } = useTranslation()
  const dispatch = useDispatch()

  // Disable back button on Android
  useEffect(() => {
    const backPressListener = () => true
    BackHandler.addEventListener('hardwareBackPress', backPressListener)
    return () => BackHandler.removeEventListener('hardwareBackPress', backPressListener)
  }, [])

  if (route.params.keylessBackupFlow === KeylessBackupFlow.Restore) {
    switch (keylessBackupStatus) {
      case KeylessBackupStatus.NotStarted:
      case KeylessBackupStatus.InProgress: {
        return (
          <SafeAreaView style={styles.progressContainer}>
            <GreenLoadingSpinner />
            <Text style={styles.title}>{t('keylessBackupStatus.restore.inProgress.title')}</Text>
          </SafeAreaView>
        )
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
                      currencyCode: Currency.Dollar,
                      exchangeRate: '1',
                    }}
                    showLocalAmount={true}
                    amount={new BigNumber(0)}
                  />
                </Trans>
              }
              isVisible={true}
              actionText={t('importExistingKey.emptyWalletDialog.action')}
              actionPress={() => dispatch(keylessBackupAcceptZeroBalance())}
              secondaryActionText={t('goBack')}
              secondaryActionPress={() => dispatch(keylessBackupBail())}
              testID="ConfirmUseAccountDialog"
            >
              {t('importExistingKey.emptyWalletDialog.description')}
            </Dialog>
          </SafeAreaView>
        )
      }
      // TODO(ACT-781): Implement Success screen
      // TODO(ACT-780): Implement Failure screens
    }
  }

  const onPressContinue = () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_progress_completed_continue)
    navigateHome()
  }

  const onPressManual = async () => {
    ValoraAnalytics.track(KeylessBackupEvents.cab_progress_failed_manual)
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

  switch (keylessBackupStatus) {
    case KeylessBackupStatus.NotStarted:
    case KeylessBackupStatus.InProgress: {
      return (
        <SafeAreaView style={styles.progressContainer}>
          <GreenLoadingSpinner />
          <Text style={styles.title}>{t('keylessBackupStatus.setup.inProgress.title')}</Text>
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
            <Text style={styles.title}>{t('keylessBackupStatus.setup.completed.title')}</Text>
            <Text style={styles.body}>{t('keylessBackupStatus.setup.completed.body')}</Text>
          </View>
          <Button
            testID="KeylessBackupProgress/Continue"
            onPress={onPressContinue}
            text={t('continue')}
            size={BtnSizes.FULL}
            type={BtnTypes.ONBOARDING}
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
            testID="KeylessBackupProgress/Later"
            onPress={onPressLater}
            text={t('keylessBackupStatus.setup.failed.later')}
            size={BtnSizes.FULL}
            type={BtnTypes.ONBOARDING}
            style={styles.button}
            touchableStyle={styles.buttonTouchable}
          />
          <Button
            testID="KeylessBackupProgress/Manual"
            onPress={onPressManual}
            text={t('keylessBackupStatus.setup.failed.manual')}
            size={BtnSizes.FULL}
            type={BtnTypes.ONBOARDING_SECONDARY}
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

const styles = StyleSheet.create({
  iconContainer: {},
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
    ...fontStyles.h2,
    paddingTop: Spacing.Regular16,
    textAlign: 'center',
    marginBottom: Spacing.Regular16,
  },
  body: {
    ...fontStyles.regular,
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
})

export default KeylessBackupProgress
