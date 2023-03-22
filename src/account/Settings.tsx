import { isE164NumberStrict } from '@celo/phone-utils'
import { sleep } from '@celo/utils/lib/async'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as Sentry from '@sentry/react-native'
import locales from 'locales'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import {
  clearStoredAccount,
  devModeTriggerClicked,
  setPincodeSuccess,
  toggleBackupState,
} from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import {
  pincodeTypeSelector,
  shouldShowRecoveryPhraseInSettingsSelector,
} from 'src/account/selectors'
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  hapticFeedbackSet,
  resetAppOpenedState,
  setAnalyticsEnabled,
  setNumberVerified,
  setRequirePinOnAppOpen,
  setSessionId,
} from 'src/app/actions'
import {
  hapticFeedbackEnabledSelector,
  phoneNumberVerifiedSelector,
  sessionIdSelector,
  supportedBiometryTypeSelector,
  walletConnectEnabledSelector,
} from 'src/app/selectors'
import Dialog from 'src/components/Dialog'
import SectionHead from 'src/components/SectionHead'
import SessionId from 'src/components/SessionId'
import {
  SettingsExpandedItem,
  SettingsItemSwitch,
  SettingsItemTextValue,
} from 'src/components/SettingsItem'
import { PRIVACY_LINK, TOS_LINK } from 'src/config'
import { withTranslation } from 'src/i18n'
import { revokeVerification } from 'src/identity/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { removeStoredPin, setPincodeWithBiometry } from 'src/pincode/authentication'
import { RootState } from 'src/redux/reducers'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { RevokePhoneNumber } from 'src/verify/RevokePhoneNumber'

interface DispatchProps {
  revokeVerification: typeof revokeVerification
  setNumberVerified: typeof setNumberVerified
  resetAppOpenedState: typeof resetAppOpenedState
  setAnalyticsEnabled: typeof setAnalyticsEnabled
  toggleBackupState: typeof toggleBackupState
  devModeTriggerClicked: typeof devModeTriggerClicked
  setRequirePinOnAppOpen: typeof setRequirePinOnAppOpen
  setPincodeSuccess: typeof setPincodeSuccess
  setSessionId: typeof setSessionId
  clearStoredAccount: typeof clearStoredAccount
  hapticFeedbackSet: typeof hapticFeedbackSet
}

interface StateProps {
  account: string | null
  e164PhoneNumber: string | null
  devModeActive: boolean
  analyticsEnabled: boolean
  numberVerified: boolean
  pincodeType: PincodeType
  backupCompleted: boolean
  requirePinOnAppOpen: boolean
  preferredCurrencyCode: LocalCurrencyCode
  sessionId: string
  connectedApplications: number
  walletConnectEnabled: boolean
  supportedBiometryType: BIOMETRY_TYPE | null
  shouldShowRecoveryPhraseInSettings: boolean
  hapticFeedbackEnabled: boolean
}

type OwnProps = NativeStackScreenProps<StackParamList, Screens.Settings>

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

const mapStateToProps = (state: RootState): StateProps => {
  const { v1 } = walletConnectEnabledSelector(state)
  return {
    backupCompleted: state.account.backupCompleted,
    account: state.web3.account,
    devModeActive: state.account.devModeActive || false,
    e164PhoneNumber: state.account.e164PhoneNumber,
    analyticsEnabled: state.app.analyticsEnabled,
    numberVerified: phoneNumberVerifiedSelector(state),
    pincodeType: pincodeTypeSelector(state),
    requirePinOnAppOpen: state.app.requirePinOnAppOpen,
    preferredCurrencyCode: getLocalCurrencyCode(state),
    sessionId: sessionIdSelector(state),
    connectedApplications:
      state.walletConnect.v1.sessions.length + state.walletConnect.v2.sessions.length,
    walletConnectEnabled: v1,
    supportedBiometryType: supportedBiometryTypeSelector(state),
    shouldShowRecoveryPhraseInSettings: shouldShowRecoveryPhraseInSettingsSelector(state),
    hapticFeedbackEnabled: hapticFeedbackEnabledSelector(state),
  }
}

const mapDispatchToProps = {
  revokeVerification,
  setNumberVerified,
  resetAppOpenedState,
  setAnalyticsEnabled,
  toggleBackupState,
  devModeTriggerClicked,
  setRequirePinOnAppOpen,
  setPincodeSuccess,
  setSessionId,
  clearStoredAccount,
  hapticFeedbackSet,
}

interface State {
  showAccountKeyModal: boolean
  showRevokeModal: boolean
}

export class Account extends React.Component<Props, State> {
  componentDidMount = () => {
    const sessionId = ValoraAnalytics.getSessionId()
    if (sessionId !== this.props.sessionId) {
      this.props.setSessionId(sessionId)
    }
  }

  goToProfile = () => {
    ValoraAnalytics.track(SettingsEvents.settings_profile_edit)
    this.props.navigation.navigate(Screens.Profile)
  }

  goToConfirmNumber = () => {
    ValoraAnalytics.track(SettingsEvents.settings_verify_number)
    this.props.navigation.navigate(Screens.VerificationStartScreen, {
      hideOnboardingStep: true,
    })
  }

  goToLanguageSetting = () => {
    this.props.navigation.navigate(Screens.Language, { nextScreen: this.props.route.name })
  }

  goToLocalCurrencySetting = () => {
    this.props.navigation.navigate(Screens.SelectLocalCurrency)
  }

  goToConnectedApplications = () => {
    this.props.navigation.navigate(Screens.WalletConnectSessions)
  }

  goToLicenses = () => {
    this.props.navigation.navigate(Screens.Licenses)
    ValoraAnalytics.track(SettingsEvents.licenses_view)
  }

  goToSupport = () => {
    this.props.navigation.navigate(Screens.Support)
  }

  resetAppOpenedState = () => {
    this.props.resetAppOpenedState()
    Logger.showMessage('App onboarding state reset.')
  }

  toggleNumberVerified = () => {
    this.props.setNumberVerified(!this.props.numberVerified)
  }

  revokeNumberVerification = () => {
    this.hideConfirmRevokeModal()
    if (this.props.e164PhoneNumber && !isE164NumberStrict(this.props.e164PhoneNumber)) {
      Logger.showError('Cannot revoke verificaton: number invalid')
      return
    }
    Logger.showMessage('Revoking verification')
    this.props.revokeVerification()
  }

  toggleBackupState = () => {
    this.props.toggleBackupState()
  }

  showDebugScreen = () => {
    this.props.navigation.navigate(Screens.Debug)
  }

  onDevSettingsTriggerPress = () => {
    this.props.devModeTriggerClicked()
  }

  getDevSettingsComp() {
    const { devModeActive } = this.props

    if (!devModeActive) {
      return null
    } else {
      return (
        <View style={styles.devSettings}>
          <View style={styles.devSettingsItem}>
            <Text style={fontStyles.label}>Session ID</Text>
            <SessionId sessionId={this.props.sessionId || ''} />
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.toggleNumberVerified}>
              <Text>Toggle verification done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <RevokePhoneNumber>
              {(revokePhoneNumber) => (
                <TouchableOpacity
                  onPress={revokePhoneNumber.execute}
                  disabled={revokePhoneNumber.loading}
                >
                  <Text>Revoke Number Verification (centralized)</Text>
                </TouchableOpacity>
              )}
            </RevokePhoneNumber>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.showConfirmRevokeModal}>
              <Text>Revoke Number Verification (on-chain)</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.resetAppOpenedState}>
              <Text>Reset app opened state</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.toggleBackupState}>
              <Text>Toggle backup state</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.showDebugScreen}>
              <Text>Show Debug Screen</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={Sentry.nativeCrash}>
              <Text>Trigger a crash</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.wipeReduxStore}>
              <Text>Wipe Redux Store</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.confirmAccountRemoval}>
              <Text>Valora Quick Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }
  }

  handleUseBiometryToggle = async (turnBiometryOn: boolean) => {
    try {
      if (turnBiometryOn) {
        ValoraAnalytics.track(SettingsEvents.settings_biometry_opt_in_enable)
        await setPincodeWithBiometry()
        this.props.setPincodeSuccess(PincodeType.PhoneAuth)
        ValoraAnalytics.track(SettingsEvents.settings_biometry_opt_in_complete)
      } else {
        ValoraAnalytics.track(SettingsEvents.settings_biometry_opt_in_disable)
        await removeStoredPin()
        this.props.setPincodeSuccess(PincodeType.CustomPin)
      }
    } catch (error) {
      Logger.error('SettingsItem@onPress', 'Toggle use biometry error', error)
      ValoraAnalytics.track(SettingsEvents.settings_biometry_opt_in_error)
    }
  }

  handleRequirePinToggle = (value: boolean) => {
    this.props.setRequirePinOnAppOpen(value)
    ValoraAnalytics.track(SettingsEvents.pin_require_on_load, {
      enabled: value,
    })
  }

  onTermsPress() {
    navigateToURI(TOS_LINK)
    ValoraAnalytics.track(SettingsEvents.tos_view)
  }

  onPrivacyPolicyPress() {
    navigateToURI(PRIVACY_LINK)
  }

  onRemoveAccountPress = () => {
    this.setState({ showAccountKeyModal: true })
  }

  hideRemoveAccountModal = () => {
    this.setState({ showAccountKeyModal: false })
  }

  onPressContinueWithAccountRemoval = async () => {
    try {
      this.setState({ showAccountKeyModal: false })
      // Ugly hack to wait for the modal to close,
      // otherwise the native modal PIN entry will not show up
      // TODO: stop using ReactNative modals and switch to react-navigation modals
      if (Platform.OS === 'ios') {
        await sleep(500)
      }
      const pinIsCorrect = await ensurePincode()
      if (pinIsCorrect) {
        ValoraAnalytics.track(SettingsEvents.start_account_removal)
        navigate(Screens.BackupPhrase, { navigatedFromSettings: true })
      }
    } catch (error) {
      Logger.error('SettingsItem@onPress', 'PIN ensure error', error)
    }
  }

  hideConfirmRemovalModal = () => {
    this.props.navigation.setParams({ promptConfirmRemovalModal: false })
  }

  wipeReduxStore = () => {
    this.props.clearStoredAccount(this.props.account || '', true)
  }

  confirmAccountRemoval = () => {
    ValoraAnalytics.track(SettingsEvents.completed_account_removal)
    this.props.clearStoredAccount(this.props.account || '')
  }

  showConfirmRevokeModal = () => {
    this.setState({ showRevokeModal: true })
  }

  hideConfirmRevokeModal = () => {
    this.setState({ showRevokeModal: false })
  }

  goToChangePin = async () => {
    try {
      ValoraAnalytics.track(SettingsEvents.change_pin_start)
      const pinIsCorrect = await ensurePincode()
      if (pinIsCorrect) {
        ValoraAnalytics.track(SettingsEvents.change_pin_current_pin_entered)
        navigate(Screens.PincodeSet, {
          changePin: true,
        })
      }
    } catch (error) {
      ValoraAnalytics.track(SettingsEvents.change_pin_current_pin_error)
      Logger.error('NavigationService@onPress', 'PIN ensure error', error)
    }
  }

  goToRecoveryPhrase = async () => {
    try {
      const pinIsCorrect = await ensurePincode()
      if (pinIsCorrect) {
        ValoraAnalytics.track(SettingsEvents.settings_recovery_phrase)
        navigate(Screens.BackupIntroduction)
      }
    } catch (error) {
      Logger.error('SettingsItem@onPress', 'PIN ensure error', error)
    }
  }

  render() {
    const { t, i18n, numberVerified } = this.props
    const promptConfirmRemovalModal = this.props.route.params?.promptConfirmRemovalModal ?? false
    const currentLanguage = locales[i18n.language]

    return (
      <SafeAreaView style={styles.container}>
        <DrawerTopBar />
        <ScrollView testID="SettingsScrollView">
          <TouchableWithoutFeedback onPress={this.onDevSettingsTriggerPress}>
            <Text style={styles.title} testID={'SettingsTitle'}>
              {t('settings')}
            </Text>
          </TouchableWithoutFeedback>
          <View style={styles.containerList}>
            <SettingsItemTextValue
              testID="EditProfile"
              title={t('editProfile')}
              onPress={this.goToProfile}
            />
            {!numberVerified && (
              <SettingsItemTextValue title={t('confirmNumber')} onPress={this.goToConfirmNumber} />
            )}
            <SettingsItemTextValue
              title={t('languageSettings')}
              testID="ChangeLanguage"
              value={currentLanguage?.name ?? t('unknown')}
              onPress={this.goToLanguageSetting}
            />
            <SettingsItemTextValue
              title={t('localCurrencySetting')}
              testID="ChangeCurrency"
              value={this.props.preferredCurrencyCode}
              onPress={this.goToLocalCurrencySetting}
            />
            {this.props.walletConnectEnabled && (
              <SettingsItemTextValue
                title={t('connectedApplications')}
                value={this.props.connectedApplications.toString()}
                onPress={this.goToConnectedApplications}
                testID="ConnectedApplications"
              />
            )}
            <SectionHead text={t('security')} style={styles.sectionTitle} />
            {this.props.shouldShowRecoveryPhraseInSettings && (
              <SettingsItemTextValue
                title={t('accountKey')}
                onPress={this.goToRecoveryPhrase}
                testID="RecoveryPhrase"
              />
            )}
            <SettingsItemTextValue
              title={t('changePin')}
              onPress={this.goToChangePin}
              testID="ChangePIN"
            />
            {this.props.supportedBiometryType && (
              <SettingsItemSwitch
                title={t('useBiometryType', {
                  biometryType: t(`biometryType.${this.props.supportedBiometryType}`),
                })}
                value={this.props.pincodeType === PincodeType.PhoneAuth}
                onValueChange={this.handleUseBiometryToggle}
                testID="useBiometryToggle"
              />
            )}
            <SettingsItemSwitch
              title={t('requirePinOnAppOpen')}
              value={this.props.requirePinOnAppOpen}
              onValueChange={this.handleRequirePinToggle}
              testID="requirePinOnAppOpenToggle"
            />
            <SectionHead text={t('appPreferences')} style={styles.sectionTitle} />
            <SettingsItemSwitch
              title={t('hapticFeedback')}
              value={this.props.hapticFeedbackEnabled}
              onValueChange={this.props.hapticFeedbackSet}
            />
            <SectionHead text={t('data')} style={styles.sectionTitle} />
            <SettingsItemSwitch
              title={t('shareAnalytics')}
              value={this.props.analyticsEnabled}
              onValueChange={this.props.setAnalyticsEnabled}
              details={t('shareAnalytics_detail')}
            />
            <SectionHead text={t('legal')} style={styles.sectionTitle} />
            <SettingsItemTextValue title={t('licenses')} onPress={this.goToLicenses} />
            <SettingsItemTextValue title={t('termsOfServiceLink')} onPress={this.onTermsPress} />
            <SettingsItemTextValue title={t('privacyPolicy')} onPress={this.onPrivacyPolicyPress} />
            <SectionHead text={''} style={styles.sectionTitle} />
            <SettingsExpandedItem
              title={t('removeAccountTitle')}
              details={t('removeAccountDetails')}
              onPress={this.onRemoveAccountPress}
              testID="ResetAccount"
            />
          </View>
          {this.getDevSettingsComp()}
          <Dialog
            isVisible={this.state?.showAccountKeyModal}
            title={t('accountKeyModal.header')}
            actionText={t('continue')}
            actionPress={this.onPressContinueWithAccountRemoval}
            secondaryActionText={t('cancel')}
            secondaryActionPress={this.hideRemoveAccountModal}
            testID="RemoveAccountModal"
          >
            {t('accountKeyModal.body1')}
            {'\n\n'}
            {t('accountKeyModal.body2')}
          </Dialog>
          <Dialog
            isVisible={promptConfirmRemovalModal}
            title={t('promptConfirmRemovalModal.header')}
            actionText={t('promptConfirmRemovalModal.resetNow')}
            actionPress={this.confirmAccountRemoval}
            secondaryActionText={t('cancel')}
            secondaryActionPress={this.hideConfirmRemovalModal}
            testID="ConfirmAccountRemovalModal"
          >
            {t('promptConfirmRemovalModal.body')}
          </Dialog>
          <Dialog
            isVisible={this.state?.showRevokeModal}
            title={t('promptConfirmRevokeModal.header')}
            actionText={t('promptConfirmRevokeModal.revoke')}
            actionPress={this.revokeNumberVerification}
            secondaryActionText={t('cancel')}
            secondaryActionPress={this.hideConfirmRevokeModal}
            testID="ConfirmAccountRevokeModal"
          >
            {t('promptConfirmRevokeModal.body')}
          </Dialog>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...fontStyles.h1,
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
    marginLeft: 16,
    paddingLeft: 0,
    borderBottomColor: colors.gray2,
    borderBottomWidth: 1,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>()(Account))
