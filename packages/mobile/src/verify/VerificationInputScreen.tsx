import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import {
  extractAttestationCodeFromMessage,
  extractSecurityCodeWithPrefix,
} from '@celo/utils/lib/attestations'
import { parsePhoneNumber } from '@celo/utils/lib/phoneNumbers'
import { HeaderHeightContext, StackScreenProps } from '@react-navigation/stack'
import dotProp from 'dot-prop-immutable'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { connect, useDispatch } from 'react-redux'
import { hideAlert, showMessage } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { shortVerificationCodesEnabledSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import DevSkipButton from 'src/components/DevSkipButton'
import { ALERT_BANNER_DURATION, ATTESTATION_REVEAL_TIMEOUT_SECONDS } from 'src/config'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import {
  cancelVerification,
  feelessResendAttestations,
  receiveAttestationMessage,
  resendAttestations,
} from 'src/identity/actions'
import { VerificationStatus } from 'src/identity/types'
import {
  AttestationCode,
  CodeInputType,
  NUM_ATTESTATIONS_REQUIRED,
} from 'src/identity/verification'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import TopBarTextButtonOnboarding from 'src/onboarding/TopBarTextButtonOnboarding'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { timeDeltaInSeconds } from 'src/utils/time'
import VerificationCodeInput from 'src/verify/VerificationCodeInput'
import VerificationInputHelpDialog from 'src/verify/VerificationInputHelpDialog'

const TAG = 'VerificationInputScreen'

type ScreenProps = StackScreenProps<StackParamList, Screens.VerificationInputScreen>

interface StateProps {
  e164Number: string | null
  attestationCodes: AttestationCode[]
  numCompleteAttestations: number
  verificationStatus: VerificationStatus
  underlyingError: ErrorMessages | null | undefined
  lastRevealAttempt: number | null
  feelessIsActive: boolean
  shortVerificationCodesEnabled: boolean
}

interface DispatchProps {
  cancelVerification: typeof cancelVerification
  receiveAttestationMessage: typeof receiveAttestationMessage
  resendAttestations: typeof resendAttestations
  feelessResendAttestations: typeof feelessResendAttestations
  hideAlert: typeof hideAlert
  showMessage: typeof showMessage
}

type Props = StateProps & DispatchProps & WithTranslation & ScreenProps

interface State {
  timer: number
  codeInputValues: string[]
  codeSubmittingStatuses: boolean[]
  isKeyboardVisible: boolean
}

const mapDispatchToProps = {
  cancelVerification,
  receiveAttestationMessage,
  resendAttestations,
  feelessResendAttestations,
  hideAlert,
  showMessage,
}

const mapStateToProps = (state: RootState): StateProps => {
  const feelessIsActive = state.identity.feelessVerificationState.isActive
  let attestationCodes
  let numCompleteAttestations
  let lastRevealAttempt

  if (feelessIsActive) {
    attestationCodes = state.identity.feelessAttestationCodes
    numCompleteAttestations = state.identity.feelessNumCompleteAttestations
    lastRevealAttempt = state.identity.feelessLastRevealAttempt
  } else {
    attestationCodes = state.identity.attestationCodes
    numCompleteAttestations = state.identity.numCompleteAttestations
    lastRevealAttempt = state.identity.lastRevealAttempt
  }

  return {
    e164Number: state.account.e164PhoneNumber,
    attestationCodes,
    numCompleteAttestations,
    verificationStatus: state.identity.verificationStatus,
    underlyingError: errorSelector(state),
    shortVerificationCodesEnabled: shortVerificationCodesEnabledSelector(state),
    lastRevealAttempt,
    feelessIsActive,
  }
}

function HeaderLeftButton() {
  const dispatch = useDispatch()
  const onCancel = () => {
    Logger.debug(TAG + '@onCancel', 'Cancelled, going back to education screen')
    dispatch(cancelVerification())
    navigate(Screens.VerificationEducationScreen)
  }

  return <BackButton onPress={onCancel} />
}

class VerificationInputScreen extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: ScreenProps) => ({
    ...nuxNavigationOptions,
    gestureEnabled: false,
    headerLeft: () => {
      return <HeaderLeftButton />
    },
    headerTitle: () => (
      <HeaderTitleWithSubtitle
        title={i18n.t('onboarding:verificationInput.title')}
        subTitle={i18n.t('onboarding:step', { step: '4' })}
      />
    ),
    headerRight: () => (
      <TopBarTextButtonOnboarding
        title={i18n.t('global:help')}
        testID="VerificationInputHelp"
        // tslint:disable-next-line: jsx-no-lambda
        onPress={() => navigation.setParams({ showHelpDialog: true })}
      />
    ),
  })

  interval?: number

  state: State = {
    timer: 60,
    codeInputValues: ['', '', ''],
    codeSubmittingStatuses: [false, false, false],
    isKeyboardVisible: false,
  }

  componentDidMount() {
    this.interval = window.setInterval(() => {
      const timer = this.state.timer
      if (timer === 1) {
        clearInterval(this.interval)
      }
      this.setState({ timer: timer - 1 })
    }, 1000)
  }

  componentDidUpdate(prevProps: Props) {
    if (this.isVerificationComplete(prevProps)) {
      return this.finishVerification()
    }
    if (this.isCodeRejected() && this.isAnyCodeSubmitting()) {
      this.setState({ codeSubmittingStatuses: [false, false, false] })
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  isVerificationComplete = (prevProps: Props) => {
    return (
      prevProps.numCompleteAttestations < NUM_ATTESTATIONS_REQUIRED &&
      this.props.numCompleteAttestations >= NUM_ATTESTATIONS_REQUIRED
    )
  }

  isCodeRejected = () => {
    return (
      this.props.underlyingError === ErrorMessages.INVALID_ATTESTATION_CODE ||
      this.props.underlyingError === ErrorMessages.REPEAT_ATTESTATION_CODE
    )
  }

  isAnyCodeSubmitting = () => {
    return this.state.codeSubmittingStatuses.filter((c) => c).length > 0
  }

  finishVerification = () => {
    Logger.debug(TAG + '@finishVerification', 'Verification finished, navigating to next screen.')
    this.props.hideAlert()
    navigate(Screens.ImportContacts)
  }

  onChangeInputCode = (index: number, shortVerificationCodesEnabled: boolean) => {
    return (value: string) => {
      // TODO(Rossy) Add test this of typing codes gradually
      this.setState((state) => dotProp.set(state, `codeInputValues.${index}`, value))
      if (
        (shortVerificationCodesEnabled && extractSecurityCodeWithPrefix(value)) ||
        extractAttestationCodeFromMessage(value)
      ) {
        this.setState((state) => dotProp.set(state, `codeSubmittingStatuses.${index}`, true))
        this.props.receiveAttestationMessage(value, CodeInputType.MANUAL)
      }
    }
  }

  onKeyboardToggle = (visible: boolean) => {
    this.setState({ isKeyboardVisible: visible })
  }

  onPressCodesNotReceived = () => {
    this.props.navigation.setParams({ showHelpDialog: true })
  }

  onPressWaitForCodes = () => {
    this.props.navigation.setParams({ showHelpDialog: false })
  }

  onPressSkip = () => {
    this.props.cancelVerification()
    navigateHome()
  }

  onPressResend = () => {
    const { lastRevealAttempt, feelessIsActive } = this.props
    const isRevealAllowed =
      !lastRevealAttempt ||
      timeDeltaInSeconds(Date.now(), lastRevealAttempt) > ATTESTATION_REVEAL_TIMEOUT_SECONDS

    if (isRevealAllowed) {
      if (feelessIsActive) {
        this.props.feelessResendAttestations()
      } else {
        this.props.resendAttestations()
      }
    } else {
      this.props.showMessage(
        this.props.t('verificationPrematureRevealMessage'),
        ALERT_BANNER_DURATION,
        null
      )
    }
  }

  render() {
    const { codeInputValues, codeSubmittingStatuses, isKeyboardVisible, timer } = this.state
    const {
      t,
      attestationCodes,
      numCompleteAttestations,
      route,
      shortVerificationCodesEnabled,
    } = this.props

    const showHelpDialog = route.params?.showHelpDialog || false
    const translationPlatformContext = Platform.select({ ios: 'ios' })

    const parsedNumber = parsePhoneNumber(this.props.e164Number ?? '')

    return (
      <HeaderHeightContext.Consumer>
        {(headerHeight) => (
          <SafeAreaInsetsContext.Consumer>
            {(insets) => (
              <View style={styles.container}>
                <View style={styles.innerContainer}>
                  <KeyboardAwareScrollView
                    style={headerHeight ? { marginTop: headerHeight } : undefined}
                    contentContainerStyle={[
                      styles.scrollContainer,
                      !isKeyboardVisible && insets && { marginBottom: insets.bottom },
                    ]}
                    keyboardShouldPersistTaps={'always'}
                  >
                    <DevSkipButton nextScreen={Screens.WalletHome} />
                    <Text style={styles.body}>
                      {t('verificationInput.body', {
                        context: shortVerificationCodesEnabled
                          ? 'short'
                          : translationPlatformContext,
                        phoneNumber: parsedNumber ? parsedNumber.displayNumberInternational : '',
                      })}
                    </Text>
                    {[0, 1, 2].map((i) => (
                      <View key={'verificationCodeRow' + i}>
                        <VerificationCodeInput
                          label={t('verificationInput.codeLabel' + (i + 1))}
                          index={i}
                          inputValue={codeInputValues[i]}
                          inputPlaceholder={t('verificationInput.codePlaceholder' + (i + 1), {
                            context: translationPlatformContext,
                          })}
                          inputPlaceholderWithClipboardContent={
                            shortVerificationCodesEnabled
                              ? '12345678'
                              : t('verificationInput.codePlaceholderWithCodeInClipboard')
                          }
                          isCodeSubmitting={codeSubmittingStatuses[i]}
                          onInputChange={this.onChangeInputCode(i, shortVerificationCodesEnabled)}
                          attestationCodes={attestationCodes}
                          numCompleteAttestations={numCompleteAttestations}
                          style={styles.codeInput}
                          shortVerificationCodesEnabled={shortVerificationCodesEnabled}
                        />
                      </View>
                    ))}
                    <View style={styles.spacer} />
                    <TextButton style={styles.resendButton} onPress={this.onPressResend}>
                      {t(
                        `verificationInput.resendMessages${numCompleteAttestations ? '' : '_all'}`,
                        { count: NUM_ATTESTATIONS_REQUIRED - numCompleteAttestations }
                      )}
                    </TextButton>
                  </KeyboardAwareScrollView>
                </View>
                <VerificationInputHelpDialog
                  isVisible={showHelpDialog}
                  secondsLeft={timer}
                  onPressBack={this.onPressWaitForCodes}
                  onPressSkip={this.onPressSkip}
                />
                <KeyboardSpacer onToggle={this.onKeyboardToggle} />
              </View>
            )}
          </SafeAreaInsetsContext.Consumer>
        )}
      </HeaderHeightContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.onboardingBackground,
  },
  innerContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.Regular16,
    paddingTop: 32,
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
  },
  codeInput: {
    marginBottom: Spacing.Thick24,
  },
  resendButton: {
    textAlign: 'center',
    color: colors.onboardingBrownLight,
    padding: Spacing.Regular16,
  },
  spacer: {
    flex: 1,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.onboarding)(VerificationInputScreen))
