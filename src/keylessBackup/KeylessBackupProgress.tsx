import React, { useEffect } from 'react'
import { StyleSheet, Text, BackHandler, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackParamList } from 'src/navigator/types'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'react-redux'
import { ensurePincode, navigate, navigateHome } from 'src/navigator/NavigationService'
import { keylessBackupStatusSelector } from 'src/keylessBackup/selectors'
import GreenLoadingSpinnerToCheck from 'src/icons/GreenLoadingSpinnerToCheck'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import { KeylessBackupFlow, KeylessBackupStatus } from 'src/keylessBackup/types'
import { KeylessBackupEvents } from 'src/analytics/Events'
import fontStyles from 'src/styles/fonts'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Spacing } from 'src/styles/styles'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import RedLoadingSpinnerToInfo from 'src/icons/RedLoadingSpinnerToInfo'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackup/KeylessBackupProgress'

function KeylessBackupProgress({
  route,
}: NativeStackScreenProps<StackParamList, Screens.KeylessBackupProgress>) {
  const keylessBackupStatus = useSelector(keylessBackupStatusSelector)

  const { t } = useTranslation()

  // Disable back button on Android
  useEffect(() => {
    const backPressListener = () => true
    BackHandler.addEventListener('hardwareBackPress', backPressListener)
    return () => BackHandler.removeEventListener('hardwareBackPress', backPressListener)
  }, [])

  // TODO(ACT-781): Implement Restore flow designs
  if (route.params.keylessBackupFlow === KeylessBackupFlow.Restore) {
    return <></>
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
    navigateHome()
  }

  switch (keylessBackupStatus) {
    case undefined:
    case KeylessBackupStatus.InProgress: {
      return (
        <SafeAreaView style={styles.progressContainer}>
          <GreenLoadingSpinner />
          <Text style={styles.title}>{t('keylessBackupStatus.inProgress.title')}</Text>
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
            <Text style={styles.title}>{t('keylessBackupStatus.completed.title')}</Text>
            <Text style={styles.body}>{t('keylessBackupStatus.completed.body')}</Text>
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
            <Text style={styles.title}>{t('keylessBackupStatus.failed.title')}</Text>
            <Text style={styles.body}>{t('keylessBackupStatus.failed.body')}</Text>
          </View>
          <Button
            testID="KeylessBackupProgress/Later"
            onPress={onPressLater}
            text={t('keylessBackupStatus.failed.later')}
            size={BtnSizes.FULL}
            type={BtnTypes.ONBOARDING}
            style={styles.button}
            touchableStyle={styles.buttonTouchable}
          />
          <Button
            testID="KeylessBackupProgress/Manual"
            onPress={onPressManual}
            text={t('keylessBackupStatus.failed.manual')}
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
    paddingTop: 16,
    textAlign: 'center',
    marginBottom: Spacing.Regular16,
  },
  button: {
    paddingLeft: 24,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 24,
  },
  buttonTouchable: {
    justifyContent: 'center',
  },
})

export default KeylessBackupProgress
