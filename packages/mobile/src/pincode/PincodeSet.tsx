/**
 * This is a reactnavigation SCREEN, which we use to set a PIN.
 */
import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import i18n from 'src/i18n'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { initializeAccount, setPincode } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces, withTranslation } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateClearingStack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { DEFAULT_CACHE_ACCOUNT, isPinValid } from 'src/pincode/authentication'
import { setCachedPin } from 'src/pincode/PasswordCache'
import Pincode from 'src/pincode/Pincode'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

interface StateProps {
  choseToRestoreAccount: boolean | undefined
  hideVerification: boolean
}

interface DispatchProps {
  setPincode: typeof setPincode
  initializeAccount: typeof initializeAccount
}

interface State {
  pin1: string
  pin2: string
  errorText: string | undefined
}

type ScreenProps = StackScreenProps<StackParamList, Screens.PincodeSet>

type Props = ScreenProps & StateProps & DispatchProps & WithTranslation

function mapStateToProps(state: RootState): StateProps {
  return {
    choseToRestoreAccount: state.account.choseToRestoreAccount,
    hideVerification: state.app.hideVerification,
  }
}

const mapDispatchToProps = {
  setPincode,
  initializeAccount,
}

export class PincodeSet extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state = {
    pin1: '',
    pin2: '',
    errorText: undefined,
  }

  navigateToNextScreen = () => {
    if (this.props.route.params.changePin) {
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
    return isPinValid(pin)
  }

  isPin2Valid = (pin: string) => {
    return this.state.pin1 === pin
  }

  onCompletePin1 = () => {
    if (this.isPin1Valid(this.state.pin1)) {
      this.props.navigation.setParams({ isVerifying: true })
    } else {
      ValoraAnalytics.track(OnboardingEvents.pin_invalid, { error: 'Pin is invalid' })
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
      setCachedPin(DEFAULT_CACHE_ACCOUNT, pin1)
      this.props.setPincode(PincodeType.CustomPin)
      ValoraAnalytics.track(OnboardingEvents.pin_set)
      this.navigateToNextScreen()
      if (this.props.route.params.changePin) {
        Logger.showMessage(i18n.t('accountScreen10:pinChanged'))
      }
    } else {
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
    const changePin = route.params?.changePin

    const { pin1, pin2, errorText } = this.state

    return (
      <SafeAreaView style={changePin ? styles.changePinContainer : styles.container}>
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
            title={changePin ? i18n.t('onboarding:pincodeSet.createNew') : ' '}
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
