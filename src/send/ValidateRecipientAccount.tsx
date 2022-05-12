import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import AccountNumberCard from 'src/components/AccountNumberCard'
import BackButton from 'src/components/BackButton'
import Button, { BtnTypes } from 'src/components/Button'
import CodeRow, { CodeRowStatus } from 'src/components/CodeRow'
import ErrorMessageInline from 'src/components/ErrorMessageInline'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import Modal from 'src/components/Modal'
import { SingleDigitInput } from 'src/components/SingleDigitInput'
import TextButton from 'src/components/TextButton'
import i18n, { withTranslation } from 'src/i18n'
import HamburgerCard from 'src/icons/HamburgerCard'
import InfoIcon from 'src/icons/InfoIcon'
import { validateRecipientAddress, validateRecipientAddressReset } from 'src/identity/actions'
import { AddressValidationType } from 'src/identity/reducer'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getDisplayName, Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'
import { TransactionDataInput as TransactionDataInputLegacy } from 'src/send/SendConfirmationLegacy'
import { isLegacyTransactionData } from 'src/send/utils'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'

const FULL_ADDRESS_PLACEHOLDER = '0xf1b1d5a6e7728g309c4a025k122d71ad75a61976'
const PARTIAL_ADDRESS_PLACEHOLDER = ['a', '0', 'F', '4']

interface StateProps {
  recipient: Recipient
  transactionData: TransactionDataInput | TransactionDataInputLegacy
  addressValidationType: AddressValidationType
  validationSuccessful: boolean
  isOutgoingPaymentRequest?: true
  error?: ErrorMessages | null
}

interface State {
  inputValue: string
  singleDigitInputValueArr: string[]
  isModalVisible: boolean
  digitsRefs: React.MutableRefObject<any>[]
}

interface DispatchProps {
  validateRecipientAddressReset: typeof validateRecipientAddressReset
  validateRecipientAddress: typeof validateRecipientAddress
}

type OwnProps = StackScreenProps<StackParamList, Screens.ValidateRecipientAccount>
type Props = StateProps & DispatchProps & WithTranslation & OwnProps

const mapDispatchToProps = {
  validateRecipientAddressReset,
  validateRecipientAddress,
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { route } = ownProps
  const transactionData = route.params.transactionData
  const { recipient } = transactionData
  const e164PhoneNumber = recipient.e164PhoneNumber
  const error = state.alert ? state.alert.underlyingError : null
  const validationSuccessful = e164PhoneNumber
    ? !!state.identity.secureSendPhoneNumberMapping[e164PhoneNumber]?.validationSuccessful
    : false

  return {
    recipient,
    transactionData,
    validationSuccessful,
    isOutgoingPaymentRequest: route.params.isOutgoingPaymentRequest,
    addressValidationType: route.params.addressValidationType,
    error,
  }
}

export const validateRecipientAccountScreenNavOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton eventName={SendEvents.send_secure_back} />,
})

function navigateToConfirmationScreen(
  transactionData: TransactionDataInput | TransactionDataInputLegacy,
  isOutgoingPaymentRequest: boolean,
  origin: SendOrigin
) {
  const isLegacy = isLegacyTransactionData(transactionData)
  if (isLegacy) {
    if (isOutgoingPaymentRequest) {
      navigate(Screens.PaymentRequestConfirmationLegacy, {
        transactionData: transactionData as TransactionDataInputLegacy,
        addressJustValidated: true,
      })
    } else {
      navigate(Screens.SendConfirmationLegacy, {
        transactionData: transactionData as TransactionDataInputLegacy,
        addressJustValidated: true,
        origin,
      })
    }
  } else {
    if (isOutgoingPaymentRequest) {
      Logger.showMessage(i18n.t('addressConfirmed'))
      navigate(Screens.PaymentRequestConfirmation, {
        transactionData: transactionData as TransactionDataInput,
      })
    } else {
      navigate(Screens.SendConfirmation, {
        transactionData: transactionData as TransactionDataInput,
        origin,
      })
    }
  }
}

export class ValidateRecipientAccount extends React.Component<Props, State> {
  state: State = {
    inputValue: '',
    singleDigitInputValueArr: [],
    isModalVisible: false,
    digitsRefs: [React.createRef(), React.createRef(), React.createRef(), React.createRef()],
  }

  componentDidMount = () => {
    const e164PhoneNumber = this.props.recipient.e164PhoneNumber
    if (e164PhoneNumber) {
      this.props.validateRecipientAddressReset(e164PhoneNumber)
    }
  }

  componentDidUpdate = (prevProps: Props) => {
    const { validationSuccessful, isOutgoingPaymentRequest, transactionData, route } = this.props

    if (validationSuccessful && prevProps.validationSuccessful === false) {
      navigateToConfirmationScreen(
        transactionData,
        isOutgoingPaymentRequest ?? false,
        route.params.origin
      )
    }
  }

  onPressConfirm = () => {
    const { inputValue, singleDigitInputValueArr } = this.state
    const { recipient, addressValidationType } = this.props
    const { requesterAddress } = this.props.route.params
    const inputToValidate =
      addressValidationType === AddressValidationType.FULL
        ? inputValue
        : singleDigitInputValueArr.join('')

    ValoraAnalytics.track(SendEvents.send_secure_submit, {
      partialAddressValidation: addressValidationType === AddressValidationType.PARTIAL,
      address: inputToValidate,
    })

    this.props.validateRecipientAddress(
      inputToValidate,
      addressValidationType,
      recipient,
      requesterAddress
    )
  }

  onInputChange = (value: string) => {
    this.setState({ inputValue: value })
  }

  onSingleDigitInputChange = (value: string, index: number) => {
    const { singleDigitInputValueArr, digitsRefs } = this.state
    if (value === ' ') return
    if (value !== '') {
      digitsRefs[index + 1]?.current?.focus()
    } else {
      digitsRefs[index - 1]?.current?.focus()
    }
    singleDigitInputValueArr[index] = value
    this.setState({ singleDigitInputValueArr })
  }

  toggleModal = () => {
    const { addressValidationType } = this.props

    if (this.state.isModalVisible) {
      ValoraAnalytics.track(SendEvents.send_secure_info, {
        partialAddressValidation: addressValidationType === AddressValidationType.PARTIAL,
      })
    } else {
      ValoraAnalytics.track(SendEvents.send_secure_info_dismissed, {
        partialAddressValidation: addressValidationType === AddressValidationType.PARTIAL,
      })
    }

    this.setState({ isModalVisible: !this.state.isModalVisible })
  }

  shouldShowClipboard = () => false

  renderInstructionsAndInputField = () => {
    const { t, recipient, addressValidationType } = this.props
    const { inputValue, singleDigitInputValueArr, digitsRefs } = this.state

    if (addressValidationType === AddressValidationType.FULL) {
      return (
        <View>
          <Text style={styles.body}>
            {recipient.name
              ? t('confirmAccountNumber.body1Full', { displayName: recipient.name })
              : t('confirmAccountNumber.body1FullNoDisplayName')}
          </Text>
          <Text style={styles.body}>{t('confirmAccountNumber.body2Full')}</Text>
          <Text style={styles.codeHeader}>{t('accountInputHeaderFull')}</Text>
          <CodeRow
            status={CodeRowStatus.INPUTTING}
            inputValue={inputValue}
            inputPlaceholder={FULL_ADDRESS_PLACEHOLDER}
            onInputChange={this.onInputChange}
            shouldShowClipboard={this.shouldShowClipboard}
          />
        </View>
      )
    }

    const singleDigitInputComponentArr = PARTIAL_ADDRESS_PLACEHOLDER.map(
      (placeholderValue, index) => (
        <View style={styles.singleDigitInputWrapper} key={placeholderValue}>
          <SingleDigitInput
            forwardedRef={digitsRefs[index]}
            inputValue={singleDigitInputValueArr[index]}
            inputPlaceholder={placeholderValue}
            onInputChange={(value) => this.onSingleDigitInputChange(value, index)}
            testID={`SingleDigitInput/digit${index}`}
          />
        </View>
      )
    )

    return (
      <View>
        <Text style={styles.body}>
          {recipient.name
            ? t('confirmAccountNumber.bodyPartial', { displayName: recipient.name })
            : t('confirmAccountNumber.bodyPartialNoDisplayName')}
        </Text>
        <Text style={styles.codeHeader}>{t('accountInputHeaderPartial')}</Text>
        <View style={styles.singleDigitInputContainer}>{singleDigitInputComponentArr}</View>
      </View>
    )
  }

  render = () => {
    const { t, recipient, error } = this.props
    const { singleDigitInputValueArr } = this.state
    const displayName = getDisplayName(recipient, t)
    const isFilled =
      singleDigitInputValueArr.filter((entry) => /[a-f0-9]/gi.test(entry)).length === 4

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps={'always'}
        >
          <View>
            <Text style={styles.h2}>{t('confirmAccountNumber.title')}</Text>
            <View>{this.renderInstructionsAndInputField()}</View>
            <ErrorMessageInline error={error} />
            <Button
              style={styles.button}
              onPress={this.onPressConfirm}
              text={t('confirmAccountNumber.submit')}
              type={BtnTypes.PRIMARY}
              testID="ConfirmAccountButton"
              disabled={!isFilled}
            />
          </View>
          <View style={styles.helpContainer}>
            <InfoIcon />
            <Text onPress={this.toggleModal} style={styles.askHelpText}>
              {t('confirmAccountNumber.help', { displayName })}
            </Text>
          </View>
        </KeyboardAwareScrollView>
        <KeyboardSpacer />
        <Modal isVisible={this.state.isModalVisible}>
          <Text style={styles.modalHeader}>{t('helpModal.header')}</Text>
          <Text style={styles.modalBody}>{t('helpModal.body1')}</Text>
          <View style={styles.menuContainer}>
            <View style={styles.menuCardContainer}>
              <HamburgerCard />
            </View>
            <Text style={styles.menuText}>Menu</Text>
          </View>
          <Text style={styles.modalBody}>{t('helpModal.body2')}</Text>
          <View style={styles.addressContainer}>
            <AccountNumberCard address={FULL_ADDRESS_PLACEHOLDER} />
            <Text style={styles.modalBody2}>{t('helpModal.body3')}</Text>
          </View>
          <View style={styles.modalButtonContainer}>
            <TextButton onPress={this.toggleModal}>{t('dismiss')}</TextButton>
          </View>
        </Modal>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  singleDigitInputContainer: {
    flexDirection: 'row',
  },
  singleDigitInputWrapper: {
    paddingRight: 8,
  },
  codeHeader: {
    ...fontStyles.small600,
    paddingVertical: 8,
  },
  h2: {
    ...fontStyles.h2,
    paddingVertical: 16,
  },
  button: {
    paddingVertical: 16,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  askHelpText: {
    ...fontStyles.small,
    paddingLeft: 8,
    textDecorationLine: 'underline',
  },
  body: {
    ...fontStyles.regular,
    paddingBottom: 16,
  },
  modalBody: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingVertical: 8,
  },
  modalHeader: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingBottom: 4,
  },
  modalBody2: {
    ...fontStyles.small,
    textAlign: 'center',
    color: colors.gray4,
    paddingVertical: 16,
    paddingTop: 16,
  },
  menuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  menuCardContainer: {
    paddingHorizontal: 8,
  },
  menuText: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingHorizontal: 8,
  },
  addressContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonContainer: {
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>()(ValidateRecipientAccount))
