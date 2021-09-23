/**
 * This is a reactnavigation SCREEN, which we use to set a PIN.
 */
import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { initializeAccount, setPincode } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { OnboardingEvents, SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import DevSkipButton from 'src/components/DevSkipButton'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateClearingStack, navigateHome } from 'src/navigator/NavigationService'
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
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

interface StateProps {
  choseToRestoreAccount: boolean | undefined
  hideVerification: boolean
  useExpandedBlocklist: boolean
  account: string
}

interface DispatchProps {
  setPincode: typeof setPincode
  initializeAccount: typeof initializeAccount
}

interface State {
  oldPin: string
  pin1: string
  pin2: string
  errorText: string | undefined
  blocklist: PinBlocklist | undefined
}

type ScreenProps = StackScreenProps<StackParamList, Screens.PincodeSet>

type Props = ScreenProps & StateProps & DispatchProps & WithTranslation

function mapStateToProps(state: RootState): StateProps {
  return {
    choseToRestoreAccount: state.account.choseToRestoreAccount,
    hideVerification: state.app.hideVerification,
    useExpandedBlocklist: state.app.pincodeUseExpandedBlocklist,
    account: currentAccountSelector(state) ?? '',
  }
}

const mapDispatchToProps = {
  setPincode,
  initializeAccount,
}

export class PincodeSet extends React.Component<Props, State> {
  static navigationOptions = ({ route }: ScreenProps) => {
    const changePin = route.params?.changePin
    const title = changePin
      ? i18n.t('onboarding:pincodeSet.changePIN')
      : i18n.t('onboarding:pincodeSet.create')

    return {
      ...nuxNavigationOptions,
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          title={title}
          subTitle={
            changePin
              ? ' '
              : i18n.t(
                  route.params?.choseToRestoreAccount
                    ? 'onboarding:restoreAccountSteps'
                    : 'onboarding:createAccountSteps',
                  { step: '2' }
                )
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
    this.props.navigation.setParams({ choseToRestoreAccount: this.props.choseToRestoreAccount })
  }

  isChangingPin() {
    return this.props.route.params?.changePin
  }

  navigateToNextScreen = () => {
    if (this.isChangingPin()) {
      navigate(Screens.Settings)
    } else if (this.props.choseToRestoreAccount) {
      navigate(Screens.ImportWallet)
    } else if (this.props.hideVerification || !this.props.route.params?.komenciAvailable) {
      this.props.initializeAccount()
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
      this.props.navigation.setParams({ isVerifying: true })
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
      this.props.setPincode(PincodeType.CustomPin)
      if (this.isChangingPin()) {
        const updated = await updatePin(this.props.account, this.state.oldPin, pin2)
        if (updated) {
          ValoraAnalytics.track(SettingsEvents.change_pin_new_pin_confirmed)
          Logger.showMessage(i18n.t('accountScreen10:pinChanged'))
        } else {
          ValoraAnalytics.track(SettingsEvents.change_pin_new_pin_error)
          Logger.showMessage(i18n.t('accountScreen10:pinChangeFailed'))
        }
      } else {
        setCachedPin(DEFAULT_CACHE_ACCOUNT, pin1)
        ValoraAnalytics.track(OnboardingEvents.pin_set)
      }
      this.navigateToNextScreen()
    } else {
      if (this.isChangingPin()) {
        ValoraAnalytics.track(SettingsEvents.change_pin_new_pin_error)
      }
      this.props.navigation.setParams({ isVerifying: false })
      ValoraAnalytics.track(OnboardingEvents.pin_invalid, { error: 'Pins do not match' })
      this.setState({
        pin1: '',
        pin2: '',
        errorText: this.props.t('pincodeSet.pinsDontMatch'),
      })
    }
  }

  render() {
    const { route } = this.props
    const isVerifying = route.params?.isVerifying
    const changingPin = this.isChangingPin()

    const { pin1, pin2, errorText } = this.state

    return (
      <SafeAreaView style={changingPin ? styles.changePinContainer : styles.container}>
        <DevSkipButton onSkip={this.navigateToNextScreen} />
        {isVerifying ? (
          <Pincode
            title={i18n.t('onboarding:pincodeSet.verify')}
            errorText={errorText}
            pin={pin2}
            onChangePin={this.onChangePin2}
            onCompletePin={this.onCompletePin2}
          />
        ) : (
          <Pincode
            title={changingPin ? i18n.t('onboarding:pincodeSet.createNew') : ' '}
            errorText={errorText}
            pin={pin1}
            onChangePin={this.onChangePin1}
            onCompletePin={this.onCompletePin1}
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
)(withTranslation<Props>(Namespaces.onboarding)(PincodeSet))
