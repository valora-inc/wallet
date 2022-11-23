/**
 * This is a reactnavigation SCREEN, which we use to set a PIN.
 */
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { initializeAccount, setPincodeSuccess } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { OnboardingEvents, SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  centralPhoneVerificationEnabledSelector,
  registrationStepsSelector,
  showGuidedOnboardingSelector,
  skipVerificationSelector,
  supportedBiometryTypeSelector,
} from 'src/app/selectors'
import DevSkipButton from 'src/components/DevSkipButton'
import i18n, { withTranslation } from 'src/i18n'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import {
  navigate,
  navigateClearingStack,
  navigateHome,
  popToScreen,
} from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import {
  DEFAULT_CACHE_ACCOUNT,
  isPinValid,
  PinBlocklist,
  updatePin,
} from 'src/pincode/authentication'
import { getCachedPin, setCachedPin } from 'src/pincode/PasswordCache'
import Pincode from 'src/pincode/Pincode'
import { RootState } from 'src/redux/reducers'
import colors from 'src/styles/colors'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

interface StateProps {
  choseToRestoreAccount: boolean | undefined
  hideVerification: boolean
  useExpandedBlocklist: boolean
  account: string
  registrationStep: { step: number; totalSteps: number }
  supportedBiometryType: BIOMETRY_TYPE | null
  skipVerification: boolean
  showGuidedOnboarding: boolean
  centralPhoneVerificationEnabled: boolean
}

interface DispatchProps {
  initializeAccount: typeof initializeAccount
  setPincodeSuccess: typeof setPincodeSuccess
  setHasSeenVerificationNux: typeof setHasSeenVerificationNux
}

interface State {
  oldPin: string
  pin1: string
  pin2: string
  errorText: string | undefined
  blocklist: PinBlocklist | undefined
  isVerifying: boolean
}

type ScreenProps = NativeStackScreenProps<StackParamList, Screens.PincodeSet>

type Props = ScreenProps & StateProps & DispatchProps & WithTranslation

function mapStateToProps(state: RootState): StateProps {
  return {
    choseToRestoreAccount: state.account.choseToRestoreAccount,
    registrationStep: registrationStepsSelector(state),
    hideVerification: state.app.hideVerification,
    useExpandedBlocklist: state.app.pincodeUseExpandedBlocklist,
    account: currentAccountSelector(state) ?? '',
    supportedBiometryType: supportedBiometryTypeSelector(state),
    skipVerification: skipVerificationSelector(state),
    showGuidedOnboarding: showGuidedOnboardingSelector(state),
    centralPhoneVerificationEnabled: centralPhoneVerificationEnabledSelector(state),
  }
}

const mapDispatchToProps = {
  initializeAccount,
  setPincodeSuccess,
  setHasSeenVerificationNux,
}

export class PincodeSet extends React.Component<Props, State> {
  static navigationOptions = ({ route }: ScreenProps) => {
    const changePin = route.params?.changePin
    const showGuidedOnboarding = route.params?.showGuidedOnboarding
    let title = i18n.t('pincodeSet.create')
    if (changePin) {
      title = i18n.t('pincodeSet.changePIN')
    } else if (showGuidedOnboarding) {
      title = i18n.t('pincodeSet.selectPIN')
    }
    return {
      ...nuxNavigationOptions,
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          title={title}
          subTitle={
            changePin
              ? ' '
              : i18n.t('registrationSteps', {
                  step: route.params?.registrationStep?.step,
                  totalSteps: route.params?.registrationStep?.totalSteps,
                })
          }
        />
      ),
    }
  }

  state: State = {
    oldPin: '',
    pin1: '',
    pin2: '',
    errorText: undefined,
    blocklist: undefined,
    isVerifying: false,
  }

  componentDidMount = () => {
    if (this.isChangingPin()) {
      // We're storing the PIN on the state because it will definitely be in the cache now
      // but it might expire by the time the user enters their new PIN if they take more
      // than 5 minutes to do so.
      this.setState({ oldPin: getCachedPin(DEFAULT_CACHE_ACCOUNT) ?? '' })
    }
    // Load the PIN blocklist from the bundle into the component state.
    if (this.props.useExpandedBlocklist) {
      this.setState({ blocklist: new PinBlocklist() })
    }

    // Setting choseToRestoreAccount on route param for navigationOptions
    this.props.navigation.setParams({
      choseToRestoreAccount: this.props.choseToRestoreAccount,
      registrationStep: this.props.registrationStep,
    })
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.registrationStep.step !== this.props.registrationStep.step) {
      this.props.navigation.setParams({
        registrationStep: this.props.registrationStep,
      })
    }
  }

  isChangingPin() {
    return this.props.route.params?.changePin
  }

  navigateToNextScreen = () => {
    if (this.isChangingPin()) {
      navigate(Screens.Settings)
    } else if (this.props.supportedBiometryType !== null) {
      navigate(Screens.EnableBiometry)
    } else if (this.props.choseToRestoreAccount) {
      popToScreen(Screens.Welcome)
      navigate(Screens.ImportWallet)
    } else if (
      this.props.hideVerification ||
      (!this.props.route.params?.komenciAvailable && !this.props.centralPhoneVerificationEnabled) ||
      this.props.skipVerification
    ) {
      this.props.initializeAccount()
      // Tell the app that the user has already seen verification so that it
      // doesn't prompt for verification after the app is killed. This same function
      // is called when the user manually skips verification on the verification screen.
      this.props.skipVerification && this.props.setHasSeenVerificationNux(true)
      navigateHome()
    } else {
      navigateClearingStack(Screens.VerificationEducationScreen)
    }
  }

  onChangePin1 = (pin1: string) => {
    this.setState({ pin1, errorText: undefined })
  }

  onChangePin2 = (pin2: string) => {
    this.setState({ pin2 })
  }

  isPin1Valid = (pin: string) => {
    return (
      isPinValid(pin) &&
      (!this.props.useExpandedBlocklist || this.state.blocklist?.contains(pin) === false)
    )
  }

  isPin2Valid = (pin: string) => {
    return this.state.pin1 === pin
  }

  onCompletePin1 = () => {
    if (this.isPin1Valid(this.state.pin1)) {
      this.setState({ isVerifying: true })
      if (this.isChangingPin()) {
        ValoraAnalytics.track(SettingsEvents.change_pin_new_pin_entered)
      }
    } else {
      ValoraAnalytics.track(OnboardingEvents.pin_invalid, { error: 'Pin is invalid' })
      if (this.isChangingPin()) {
        ValoraAnalytics.track(SettingsEvents.change_pin_new_pin_error)
      }

      this.setState({
        pin1: '',
        pin2: '',
        errorText: this.props.t('pincodeSet.invalidPin'),
      })
    }
  }

  onCompletePin2 = async (pin2: string) => {
    const { pin1 } = this.state
    if (this.isPin1Valid(pin1) && this.isPin2Valid(pin2)) {
      if (this.isChangingPin()) {
        const updated = await updatePin(this.props.account, this.state.oldPin, pin2)
        if (updated) {
          ValoraAnalytics.track(SettingsEvents.change_pin_new_pin_confirmed)
          Logger.showMessage(this.props.t('pinChanged'))
        } else {
          ValoraAnalytics.track(SettingsEvents.change_pin_new_pin_error)
          Logger.showMessage(this.props.t('pinChangeFailed'))
        }
      } else {
        this.props.setPincodeSuccess(PincodeType.CustomPin)
        setCachedPin(DEFAULT_CACHE_ACCOUNT, pin1)
        ValoraAnalytics.track(OnboardingEvents.pin_set)
      }
      this.navigateToNextScreen()
    } else {
      if (this.isChangingPin()) {
        ValoraAnalytics.track(SettingsEvents.change_pin_new_pin_error)
      }
      ValoraAnalytics.track(OnboardingEvents.pin_invalid, { error: 'Pins do not match' })
      this.setState({
        isVerifying: false,
        pin1: '',
        pin2: '',
        errorText: this.props.t('pincodeSet.pinsDontMatch'),
      })
    }
  }

  render() {
    const { t } = this.props
    const changingPin = this.isChangingPin()
    const { errorText, isVerifying, pin1, pin2 } = this.state

    return (
      <SafeAreaView style={changingPin ? styles.changePinContainer : styles.container}>
        <DevSkipButton onSkip={this.navigateToNextScreen} />
        {isVerifying ? (
          <Pincode
            title={this.props.showGuidedOnboarding ? ' ' : t('pincodeSet.verify')}
            errorText={errorText}
            pin={pin2}
            onChangePin={this.onChangePin2}
            onCompletePin={this.onCompletePin2}
            onBoardingSetPin={!changingPin}
            verifyPin={true}
          />
        ) : (
          <Pincode
            title={changingPin ? t('pincodeSet.createNew') : ' '}
            errorText={errorText}
            pin={pin1}
            onChangePin={this.onChangePin1}
            onCompletePin={this.onCompletePin1}
            onBoardingSetPin={!changingPin}
          />
        )}
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
    justifyContent: 'space-between',
  },
  changePinContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>()(PincodeSet))
