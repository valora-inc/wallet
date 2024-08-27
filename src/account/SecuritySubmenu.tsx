import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native'
import * as Sentry from '@sentry/react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  SettingsItemTextValue,
  SettingsItemCta,
  SettingsItemSwitch,
  SettingsExpandedItem,
} from 'src/components/SettingsItem'
import Dialog from 'src/components/Dialog'
import { Screens } from 'src/navigator/Screens'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import { PincodeType } from 'src/account/reducer'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Toast from 'src/components/Toast'
import { showError } from 'src/alert/actions'
import { NotificationVariant } from 'src/components/InLineNotification'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import {
  resetAppOpenedState,
  setAnalyticsEnabled,
  setNumberVerified,
  setRequirePinOnAppOpen,
  setSessionId,
} from 'src/app/actions'
import SessionId from 'src/components/SessionId'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import CustomHeader from 'src/components/header/CustomHeader'
import variables from 'src/styles/variables'
import BackButton from 'src/components/BackButton'
import Logger from 'src/utils/Logger'
import { getFeatureGate } from 'src/statsig/index'
import { StatsigFeatureGates } from 'src/statsig/types'
import {
  deleteKeylessBackupStatusSelector,
  showDeleteKeylessBackupErrorSelector,
} from 'src/keylessBackup/selectors'
import { deleteKeylessBackupStarted, hideDeleteKeylessBackupError } from 'src/keylessBackup/slice'
import { KeylessBackupDeleteStatus } from 'src/keylessBackup/types'
import {
  cloudBackupCompletedSelector,
  devModeSelector,
  pincodeTypeSelector,
} from 'src/account/selectors'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import {
  analyticsEnabledSelector,
  getRequirePinOnAppOpen,
  phoneNumberVerifiedSelector,
  sessionIdSelector,
  supportedBiometryTypeSelector,
} from 'src/app/selectors'
import { removeStoredPin, setPincodeWithBiometry } from 'src/pincode/authentication'
import {
  clearStoredAccount,
  devModeTriggerClicked,
  setPincodeSuccess,
  toggleBackupState,
} from 'src/account/actions'
import { useRevokeCurrentPhoneNumber } from 'src/verify/hooks'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.SecuritySubmenu>

export const SecuritySubmenu = ({ route, navigation }: Props) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const promptConfirmRemovalModal = route.params?.promptConfirmRemovalModal

  const account = useSelector(walletAddressSelector)

  const showKeylessBackup = getFeatureGate(StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_SETUP)
  const deleteKeylessBackupStatus = useSelector(deleteKeylessBackupStatusSelector)
  const cloudBackupCompleted = useSelector(cloudBackupCompletedSelector)

  const revokeNumberAsync = useRevokeCurrentPhoneNumber()

  const supportedBiometryType = useSelector(supportedBiometryTypeSelector)

  const pincodeType = useSelector(pincodeTypeSelector)
  const requirePinOnAppOpen = useSelector(getRequirePinOnAppOpen)

  const analyticsEnabled = useSelector(analyticsEnabledSelector)

  const resetAccountBottomSheetRef = useRef<BottomSheetRefType>(null)
  const deleteAccountBottomSheetRef = useRef<BottomSheetRefType>(null)

  const showDeleteKeylessBackupError = useSelector(showDeleteKeylessBackupErrorSelector)

  const numberVerified = useSelector(phoneNumberVerifiedSelector)

  const devModeActive = useSelector(devModeSelector)

  const sessionId = useSelector(sessionIdSelector)

  useEffect(() => {
    if (AppAnalytics.getSessionId() !== sessionId) {
      dispatch(setSessionId(sessionId))
    }
  }, [])

  const onPressContinueWithAccountRemoval = async () => {
    try {
      resetAccountBottomSheetRef.current?.close()
      const pinIsCorrect = await ensurePincode()
      if (pinIsCorrect) {
        AppAnalytics.track(SettingsEvents.start_account_removal)
        navigate(Screens.BackupPhrase, { isAccountRemoval: true })
      }
    } catch (error) {
      Logger.error('SettingsItem@onPress', 'PIN ensure error', error)
    }
  }
  const onDismissKeylessBackupError = () => {
    dispatch(hideDeleteKeylessBackupError())
  }
  const onRemoveAccountPress = () => {
    resetAccountBottomSheetRef.current?.snapToIndex(0)
  }

  const onDeleteAccountPress = () => {
    AppAnalytics.track(SettingsEvents.settings_delete_account)
    deleteAccountBottomSheetRef.current?.snapToIndex(0)
  }

  const handleDeleteAccount = async () => {
    AppAnalytics.track(SettingsEvents.settings_delete_account_confirm)

    if (numberVerified) {
      try {
        await revokeNumberAsync.execute()
      } catch (error) {
        dispatch(showError(t('revokePhoneNumber.revokeError')))
        return
      }
    }

    deleteAccountBottomSheetRef.current?.close()
    return onPressContinueWithAccountRemoval()
  }

  const handleToggleAnalytics = (value: boolean) => {
    dispatch(setAnalyticsEnabled(value))
    AppAnalytics.track(SettingsEvents.settings_analytics, {
      enabled: value,
    })
  }

  const handleRequirePinToggle = (value: boolean) => {
    dispatch(setRequirePinOnAppOpen(value))
    AppAnalytics.track(SettingsEvents.pin_require_on_load, {
      enabled: value,
    })
  }

  const handleUseBiometryToggle = async (turnBiometryOn: boolean) => {
    try {
      if (turnBiometryOn) {
        AppAnalytics.track(SettingsEvents.settings_biometry_opt_in_enable)
        await setPincodeWithBiometry()
        dispatch(setPincodeSuccess(PincodeType.PhoneAuth))
        AppAnalytics.track(SettingsEvents.settings_biometry_opt_in_complete)
      } else {
        AppAnalytics.track(SettingsEvents.settings_biometry_opt_in_disable)
        await removeStoredPin()
        dispatch(setPincodeSuccess(PincodeType.CustomPin))
      }
    } catch (error) {
      Logger.error('SettingsItem@onPress', 'Toggle use biometry error', error)
      AppAnalytics.track(SettingsEvents.settings_biometry_opt_in_error)
    }
  }

  const goToChangePin = async () => {
    try {
      AppAnalytics.track(SettingsEvents.change_pin_start)
      const pinIsCorrect = await ensurePincode()
      if (pinIsCorrect) {
        AppAnalytics.track(SettingsEvents.change_pin_current_pin_entered)
        navigate(Screens.PincodeSet, {
          changePin: true,
        })
      }
    } catch (error) {
      AppAnalytics.track(SettingsEvents.change_pin_current_pin_error)
      Logger.error('NavigationService@onPress', 'PIN ensure error', error)
    }
  }

  const onPressDeleteKeylessBackup = () => {
    AppAnalytics.track(SettingsEvents.settings_delete_keyless_backup)
    dispatch(deleteKeylessBackupStarted())
  }

  const onPressSetUpKeylessBackup = async () => {
    try {
      const pinIsCorrect = await ensurePincode()
      if (pinIsCorrect) {
        AppAnalytics.track(SettingsEvents.settings_set_up_keyless_backup)
        navigate(Screens.WalletSecurityPrimer)
      }
    } catch (error) {
      Logger.error('SettingsItem@onPress', 'PIN ensure error - onPressSetUpKeylessBackup', error)
    }
  }

  const goToRecoveryPhrase = async () => {
    try {
      const pinIsCorrect = await ensurePincode()
      if (pinIsCorrect) {
        AppAnalytics.track(SettingsEvents.settings_recovery_phrase)
        navigate(Screens.BackupIntroduction)
      }
    } catch (error) {
      Logger.error('SecurityItem@onPress', 'PIN ensure error', error)
    }
  }

  const onDevSettingsTriggerPress = () => {
    dispatch(devModeTriggerClicked())
  }

  const showDebugScreen = () => {
    navigate(Screens.Debug)
  }

  const toggleNumberVerified = () => {
    dispatch(setNumberVerified(numberVerified))
  }

  const handleResetAppOpenedState = () => {
    Logger.showMessage('App onboarding state reset.')
    dispatch(resetAppOpenedState())
  }

  const handleToggleBackupState = () => {
    dispatch(toggleBackupState())
  }

  const wipeReduxStore = () => {
    dispatch(clearStoredAccount(account ?? '', true))
  }

  const confirmAccountRemoval = () => {
    AppAnalytics.track(SettingsEvents.completed_account_removal)
    dispatch(clearStoredAccount(account ?? ''))
  }

  const hideConfirmRemovalModal = () => {
    navigation.setParams({ promptConfirmRemovalModal: false })
  }

  const getDevSettingsComp = () => {
    if (!devModeActive) {
      return null
    } else {
      return (
        <View style={styles.devSettings}>
          <View style={styles.devSettingsItem}>
            <Text style={typeScale.labelSemiBoldSmall}>Session ID</Text>
            <SessionId sessionId={sessionId || ''} />
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={toggleNumberVerified}>
              <Text>Toggle verification done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={handleResetAppOpenedState}>
              <Text>Reset app opened state</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={handleToggleBackupState}>
              <Text>Toggle backup state</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={showDebugScreen}>
              <Text>Show Debug Screen</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={Sentry.nativeCrash}>
              <Text>Trigger a crash</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={wipeReduxStore}>
              <Text>Wipe Redux Store</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={confirmAccountRemoval}>
              <Text>App Quick Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }
  }

  const getKeylessBackupItem = () => {
    if (!showKeylessBackup) {
      return null
    }
    if (deleteKeylessBackupStatus === KeylessBackupDeleteStatus.InProgress) {
      return (
        <SettingsItemCta
          title={t('keylessBackupSettingsTitle')}
          onPress={() => {
            // do nothing
          }}
          testID="KeylessBackup"
          cta={
            <>
              <LoadingSpinner width={22} />
              <Text testID={`KeylessBackup/cta`} style={styles.value}>
                {t('pleaseWait')}
              </Text>
            </>
          }
        />
      )
    } else if (cloudBackupCompleted) {
      return (
        <SettingsItemCta
          title={t('keylessBackupSettingsTitle')}
          onPress={onPressDeleteKeylessBackup}
          testID="KeylessBackup"
          showChevron
          cta={
            <>
              <Text testID={`KeylessBackup/cta`} style={styles.value}>
                {t('delete')}
              </Text>
            </>
          }
        />
      )
    } else {
      return (
        <SettingsItemCta
          title={t('keylessBackupSettingsTitle')}
          onPress={onPressSetUpKeylessBackup}
          testID="KeylessBackup"
          showChevron
          cta={
            <>
              <Text testID={`KeylessBackup/cta`} style={styles.value}>
                {t('setup')}
              </Text>
            </>
          }
        />
      )
    }
  }

  return (
    <SafeAreaView>
      <CustomHeader
        left={<BackButton />}
        title={
          <TouchableWithoutFeedback onPress={onDevSettingsTriggerPress}>
            <Text style={styles.title} testID="SecurityTitle">
              {t('securityPrivacy')}
            </Text>
          </TouchableWithoutFeedback>
        }
        style={styles.header}
      />
      <ScrollView>
        <SettingsItemTextValue
          title={t('accountKey')}
          onPress={goToRecoveryPhrase}
          testID="RecoveryPhrase"
          showChevron
        />
        {getKeylessBackupItem()}
        <SettingsItemTextValue
          title={t('changePin')}
          onPress={goToChangePin}
          testID="ChangePIN"
          showChevron
        />
        {supportedBiometryType && (
          <SettingsItemSwitch
            title={t('useBiometryType', {
              biometryType: t(`biometryType.${supportedBiometryType}`),
            })}
            value={pincodeType === PincodeType.PhoneAuth}
            onValueChange={handleUseBiometryToggle}
            testID="useBiometryToggle"
          />
        )}
        <SettingsItemSwitch
          title={t('requirePinOnAppOpen')}
          value={requirePinOnAppOpen}
          onValueChange={handleRequirePinToggle}
          testID="requirePinOnAppOpenToggle"
        />
        <SettingsItemSwitch
          title={t('shareAnalytics')}
          value={analyticsEnabled}
          onValueChange={handleToggleAnalytics}
          details={t('shareAnalytics_detail')}
        />
        <SettingsExpandedItem
          title={t('removeAccountTitle')}
          details={t('removeAccountDetails')}
          onPress={onRemoveAccountPress}
          testID="ResetAccount"
        />
        <SettingsExpandedItem
          title={t('deleteAccountTitle')}
          details={t('deleteAccountDetails')}
          onPress={onDeleteAccountPress}
          testID="DeleteAccount"
        />
        {getDevSettingsComp()}
        <Dialog
          isVisible={!!promptConfirmRemovalModal}
          title={t('promptConfirmRemovalModal.header')}
          actionText={t('promptConfirmRemovalModal.resetNow')}
          actionPress={confirmAccountRemoval}
          secondaryActionText={t('cancel')}
          secondaryActionPress={hideConfirmRemovalModal}
          testID="ConfirmAccountRemovalModal"
        >
          {t('promptConfirmRemovalModal.body')}
        </Dialog>
      </ScrollView>
      <Toast
        withBackdrop
        variant={NotificationVariant.Warning}
        description={t('keylessBackupSettingsDeleteError')}
        showToast={showDeleteKeylessBackupError}
        onPressCta={onDismissKeylessBackupError}
        onUnmount={onDismissKeylessBackupError}
        onDismiss={onDismissKeylessBackupError}
        ctaLabel={t('dismiss')}
        title={t('error')}
        testID="KeylessBackupDeleteError"
      />
      <BottomSheet
        forwardedRef={resetAccountBottomSheetRef}
        title={t('accountKeyModal.header')}
        description={`${t('accountKeyModal.body1')}\n\n${t('accountKeyModal.body2')}`}
        testId="ResetAccountBottomSheet"
      >
        <Button
          style={{ marginTop: Spacing.Regular16 }}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          onPress={onPressContinueWithAccountRemoval}
          text={t('continue')}
          disabled={revokeNumberAsync.loading}
          testID="ResetAccountButton"
        />
      </BottomSheet>
      <BottomSheet
        forwardedRef={deleteAccountBottomSheetRef}
        title={t('deleteAccountWarning.title')}
        description={t('deleteAccountWarning.description')}
        testId="DeleteAccountBottomSheet"
      >
        <Button
          style={styles.bottomSheetButton}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          onPress={handleDeleteAccount}
          text={
            revokeNumberAsync.loading
              ? t('deleteAccountWarning.buttonLabelRevokingPhoneNumber')
              : t('deleteAccountWarning.buttonLabel')
          }
          disabled={revokeNumberAsync.loading}
          testID="DeleteAccountButton"
        />
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: variables.contentPadding,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    margin: 16,
  },
  bottomSheetButton: {
    marginTop: Spacing.Regular16,
  },
  value: {
    ...typeScale.bodyMedium,
    color: colors.gray4,
    marginRight: Spacing.Smallest8,
    marginLeft: 4,
  },
  devSettings: {
    alignItems: 'flex-start',
    padding: 15,
    marginHorizontal: 10,
  },
  devSettingsItem: {
    alignSelf: 'stretch',
    margin: 4,
  },
})

export default SecuritySubmenu
