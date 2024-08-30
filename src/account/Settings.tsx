import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as Sentry from '@sentry/react-native'
import locales from 'locales'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import RevokePhoneNumber from 'src/RevokePhoneNumber'
import {
  clearStoredAccount,
  devModeTriggerClicked,
  setPincodeSuccess,
  toggleBackupState,
} from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import {
  cloudBackupCompletedSelector,
  devModeSelector,
  pincodeTypeSelector,
} from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import {
  hapticFeedbackSet,
  resetAppOpenedState,
  setAnalyticsEnabled,
  setNumberVerified,
  setRequirePinOnAppOpen,
  setSessionId,
} from 'src/app/actions'
import {
  analyticsEnabledSelector,
  getRequirePinOnAppOpen,
  hapticFeedbackEnabledSelector,
  phoneNumberVerifiedSelector,
  sessionIdSelector,
  supportedBiometryTypeSelector,
  walletConnectEnabledSelector,
} from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import { NotificationVariant } from 'src/components/InLineNotification'
import SectionHead from 'src/components/SectionHead'
import SessionId from 'src/components/SessionId'
import {
  SettingsExpandedItem,
  SettingsItemCta,
  SettingsItemSwitch,
  SettingsItemTextValue,
} from 'src/components/SettingsItem'
import Toast from 'src/components/Toast'
import CustomHeader from 'src/components/header/CustomHeader'
import { PRIVACY_LINK, TOS_LINK } from 'src/config'
import { currentLanguageSelector } from 'src/i18n/selectors'
import ForwardChevron from 'src/icons/ForwardChevron'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import {
  deleteKeylessBackupStatusSelector,
  showDeleteKeylessBackupErrorSelector,
} from 'src/keylessBackup/selectors'
import { deleteKeylessBackupStarted, hideDeleteKeylessBackupError } from 'src/keylessBackup/slice'
import { KeylessBackupDeleteStatus } from 'src/keylessBackup/types'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { removeStoredPin, setPincodeWithBiometry } from 'src/pincode/authentication'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig/index'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { navigateToURI } from 'src/utils/linking'
import { useRevokeCurrentPhoneNumber } from 'src/verify/hooks'
import { selectSessions } from 'src/walletConnect/selectors'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.Settings>

export const Account = ({ navigation, route }: Props) => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const promptConfirmRemovalModal = route.params?.promptConfirmRemovalModal

  const revokeBottomSheetRef = useRef<BottomSheetRefType>(null)
  const deleteAccountBottomSheetRef = useRef<BottomSheetRefType>(null)
  const resetAccountBottomSheetRef = useRef<BottomSheetRefType>(null)

  const revokeNumberAsync = useRevokeCurrentPhoneNumber()

  const sessionId = useSelector(sessionIdSelector)
  const account = useSelector(walletAddressSelector)
  const devModeActive = useSelector(devModeSelector)
  const analyticsEnabled = useSelector(analyticsEnabledSelector)
  const numberVerified = useSelector(phoneNumberVerifiedSelector)
  const pincodeType = useSelector(pincodeTypeSelector)
  const requirePinOnAppOpen = useSelector(getRequirePinOnAppOpen)
  const preferredCurrencyCode = useSelector(getLocalCurrencyCode)
  const { sessions } = useSelector(selectSessions)
  const { v2 } = useSelector(walletConnectEnabledSelector)
  const supportedBiometryType = useSelector(supportedBiometryTypeSelector)
  const hapticFeedbackEnabled = useSelector(hapticFeedbackEnabledSelector)
  const currentLanguage = useSelector(currentLanguageSelector)
  const cloudBackupCompleted = useSelector(cloudBackupCompletedSelector)
  const deleteKeylessBackupStatus = useSelector(deleteKeylessBackupStatusSelector)
  const showDeleteKeylessBackupError = useSelector(showDeleteKeylessBackupErrorSelector)
  const walletConnectEnabled = v2
  const connectedApplications = sessions.length

  useEffect(() => {
    if (AppAnalytics.getSessionId() !== sessionId) {
      dispatch(setSessionId(sessionId))
    }
  }, [])

  const onDismissKeylessBackupError = () => {
    dispatch(hideDeleteKeylessBackupError())
  }

  const goToProfile = () => {
    AppAnalytics.track(SettingsEvents.settings_profile_edit)
    navigate(Screens.Profile)
  }

  const goToConfirmNumber = () => {
    AppAnalytics.track(SettingsEvents.settings_verify_number)
    navigate(Screens.VerificationStartScreen, { hasOnboarded: true })
  }

  const goToLanguageSetting = () => {
    navigate(Screens.Language, { nextScreen: route.name })
  }

  const goToLocalCurrencySetting = () => {
    navigate(Screens.SelectLocalCurrency)
  }

  const goToConnectedApplications = () => {
    navigate(Screens.WalletConnectSessions)
  }

  const goToLicenses = () => {
    AppAnalytics.track(SettingsEvents.licenses_view)
    navigate(Screens.Licenses)
  }

  const handleResetAppOpenedState = () => {
    Logger.showMessage('App onboarding state reset.')
    dispatch(resetAppOpenedState())
  }

  const toggleNumberVerified = () => {
    dispatch(setNumberVerified(numberVerified))
  }

  const handleToggleBackupState = () => {
    dispatch(toggleBackupState())
  }

  const showDebugScreen = () => {
    navigate(Screens.Debug)
  }

  const onDevSettingsTriggerPress = () => {
    dispatch(devModeTriggerClicked())
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
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={() => navigate(Screens.DebugImages)}>
              <Text>See app assets</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }
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

  const handleRequirePinToggle = (value: boolean) => {
    dispatch(setRequirePinOnAppOpen(value))
    AppAnalytics.track(SettingsEvents.pin_require_on_load, {
      enabled: value,
    })
  }

  const handleHapticFeedbackToggle = (value: boolean) => {
    dispatch(hapticFeedbackSet(value))
    AppAnalytics.track(SettingsEvents.settings_haptic_feedback, {
      enabled: value,
    })
  }

  const handleToggleAnalytics = (value: boolean) => {
    dispatch(setAnalyticsEnabled(value))
    AppAnalytics.track(SettingsEvents.settings_analytics, {
      enabled: value,
    })
  }

  const onTermsPress = () => {
    navigateToURI(TOS_LINK)
    AppAnalytics.track(SettingsEvents.tos_view)
  }

  const onPrivacyPolicyPress = () => {
    navigateToURI(PRIVACY_LINK)
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

  const hideConfirmRemovalModal = () => {
    navigation.setParams({ promptConfirmRemovalModal: false })
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

  const onPressDeleteKeylessBackup = () => {
    AppAnalytics.track(SettingsEvents.settings_delete_keyless_backup)
    dispatch(deleteKeylessBackupStarted())
  }

  const wipeReduxStore = () => {
    dispatch(clearStoredAccount(account ?? '', true))
  }

  const confirmAccountRemoval = () => {
    AppAnalytics.track(SettingsEvents.completed_account_removal)
    dispatch(clearStoredAccount(account ?? ''))
  }

  const handleShowConfirmRevoke = () => {
    AppAnalytics.track(SettingsEvents.settings_revoke_phone_number)
    revokeBottomSheetRef.current?.snapToIndex(0)
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

  const goToRecoveryPhrase = async () => {
    try {
      const pinIsCorrect = await ensurePincode()
      if (pinIsCorrect) {
        AppAnalytics.track(SettingsEvents.settings_recovery_phrase)
        navigate(Screens.BackupIntroduction)
      }
    } catch (error) {
      Logger.error('SettingsItem@onPress', 'PIN ensure error', error)
    }
  }

  const showKeylessBackup = getFeatureGate(StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_SETUP)

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
          cta={
            <>
              <Text testID={`KeylessBackup/cta`} style={styles.value}>
                {t('setup')}
              </Text>
              <ForwardChevron />
            </>
          }
        />
      )
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader left={<BackButton />} style={styles.paddingHorizontal} />
      <ScrollView testID="SettingsScrollView">
        <TouchableWithoutFeedback onPress={onDevSettingsTriggerPress}>
          <Text style={styles.title} testID={'SettingsTitle'}>
            {t('settings')}
          </Text>
        </TouchableWithoutFeedback>
        <View style={styles.containerList}>
          <SettingsItemTextValue
            testID="EditProfile"
            title={t('editProfile')}
            onPress={goToProfile}
          />
          {!numberVerified && (
            <SettingsItemTextValue title={t('confirmNumber')} onPress={goToConfirmNumber} />
          )}
          <SettingsItemTextValue
            title={t('languageSettings')}
            testID="ChangeLanguage"
            value={locales[currentLanguage ?? '']?.name ?? t('unknown')}
            onPress={goToLanguageSetting}
          />
          <SettingsItemTextValue
            title={t('localCurrencySetting')}
            testID="ChangeCurrency"
            value={preferredCurrencyCode}
            onPress={goToLocalCurrencySetting}
          />
          {walletConnectEnabled && (
            <SettingsItemTextValue
              title={t('connectedApplications')}
              value={connectedApplications.toString()}
              onPress={goToConnectedApplications}
              testID="ConnectedApplications"
            />
          )}
          <SectionHead text={t('security')} style={styles.sectionTitle} />
          <SettingsItemTextValue
            title={t('accountKey')}
            onPress={goToRecoveryPhrase}
            testID="RecoveryPhrase"
          />
          {getKeylessBackupItem()}
          <SettingsItemTextValue
            title={t('changePin')}
            onPress={goToChangePin}
            testID="ChangePIN"
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
          <SectionHead text={t('appPreferences')} style={styles.sectionTitle} />
          <SettingsItemSwitch
            title={t('hapticFeedback')}
            value={hapticFeedbackEnabled}
            onValueChange={handleHapticFeedbackToggle}
          />
          <SectionHead text={t('data')} style={styles.sectionTitle} />
          <SettingsItemSwitch
            title={t('shareAnalytics')}
            value={analyticsEnabled}
            onValueChange={handleToggleAnalytics}
            details={t('shareAnalytics_detail')}
          />
          <SectionHead text={t('legal')} style={styles.sectionTitle} />
          <SettingsItemTextValue title={t('licenses')} onPress={goToLicenses} />
          <SettingsItemTextValue title={t('termsOfServiceLink')} onPress={onTermsPress} />
          <SettingsItemTextValue title={t('privacyPolicy')} onPress={onPrivacyPolicyPress} />

          <View style={styles.spacer} />
          {numberVerified && (
            <SettingsExpandedItem
              title={t('revokePhoneNumber.title')}
              details={t('revokePhoneNumber.description')}
              onPress={handleShowConfirmRevoke}
              testID="RevokePhoneNumber"
            />
          )}
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
        </View>
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
      <RevokePhoneNumber forwardedRef={revokeBottomSheetRef} />
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
  container: {
    flex: 1,
  },
  title: {
    ...typeScale.titleMedium,
    margin: 16,
  },
  containerList: {
    flex: 1,
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
  sectionTitle: {
    marginTop: 44,
    marginHorizontal: 16,
    paddingLeft: 0,
    borderBottomColor: colors.gray2,
    borderBottomWidth: 1,
  },
  spacer: {
    height: 80,
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
  paddingHorizontal: {
    paddingHorizontal: variables.contentPadding,
  },
})

export default Account
