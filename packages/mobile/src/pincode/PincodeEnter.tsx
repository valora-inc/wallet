/**
 * This is a reactnavigation SCREEN to which we navigate,
 * when we need to fetch a PIN from a user.
 */
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { AuthenticationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { modalScreenOptions } from 'src/navigator/Navigator'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { checkPin } from 'src/pincode/authentication'
import Pincode from 'src/pincode/Pincode'
import { RootState } from 'src/redux/reducers'
import { currentAccountSelector } from 'src/web3/selectors'

interface State {
  pin: string
  errorText: string | undefined
  pinIsCorrect: boolean
}

interface StateProps {
  currentAccount: string | null
}

type RouteProps = StackScreenProps<StackParamList, Screens.PincodeEnter>
type Props = StateProps & WithTranslation & RouteProps

class PincodeEnter extends React.Component<Props, State> {
  static navigationOptions = (navOptions: RouteProps) => ({
    ...modalScreenOptions(navOptions),
    ...headerWithBackButton,
    gestureEnabled: false,
  })

  state = {
    pin: '',
    errorText: undefined,
    pinIsCorrect: false,
  }

  componentDidMount() {
    ValoraAnalytics.track(AuthenticationEvents.get_pincode_with_input_start)
  }

  componentWillUnmount() {
    const onCancel = this.props.route.params.onCancel
    if (onCancel && !this.state.pinIsCorrect) {
      onCancel()
    }
  }

  onChangePin = (pin: string) => {
    this.setState({ pin, errorText: undefined })
  }

  onCorrectPin = (pin: string) => {
    this.setState({ pinIsCorrect: true })
    const onSuccess = this.props.route.params.onSuccess
    if (onSuccess) {
      ValoraAnalytics.track(AuthenticationEvents.get_pincode_with_input_complete)
      onSuccess(pin)
    }
  }

  onWrongPin = () => {
    this.setState({
      pin: '',
      errorText: this.props.t(`${ErrorMessages.INCORRECT_PIN}`),
    })
    ValoraAnalytics.track(AuthenticationEvents.get_pincode_with_input_error)
  }

  onPressConfirm = async () => {
    const { route, currentAccount } = this.props
    const { pin } = this.state
    const withVerification = route.params.withVerification
    const account = currentAccount ?? route.params.account
    if (withVerification && account) {
      if (await checkPin(pin, account)) {
        this.onCorrectPin(pin)
      } else {
        this.onWrongPin()
      }
    } else {
      this.onCorrectPin(pin)
    }
  }

  render() {
    const { t } = this.props
    const { pin, errorText } = this.state
    return (
      <SafeAreaView style={styles.container}>
        <Pincode
          title={t('confirmPin.title')}
          errorText={errorText}
          pin={pin}
          onChangePin={this.onChangePin}
          onCompletePin={this.onPressConfirm}
        />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
})

const mapStateToProps = (state: RootState): StateProps => ({
  currentAccount: currentAccountSelector(state),
})

export default connect(mapStateToProps)(withTranslation<Props>()(PincodeEnter))
