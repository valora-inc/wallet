import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useLayoutEffect } from 'react'
import { connect } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import ExchangeConfirmationCard, {
  ExchangeConfirmationCardProps,
} from 'src/exchange/ExchangeConfirmationCard'
import i18n from 'src/i18n'
import { addressToDisplayNameSelector, SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { HeaderTitleWithSubtitle, headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import useSelector from 'src/redux/useSelector'
import TransferConfirmationCard, {
  TransferConfirmationCardProps,
} from 'src/transactions/TransferConfirmationCard'
import { exchangeReviewHeader, transferReviewHeader } from 'src/transactions/utils'
import { getDatetimeDisplayString } from 'src/utils/time'

interface StateProps {
  addressHasChanged: boolean
}
export interface ReviewProps {
  type: TokenTransactionType
  timestamp: number
}

type OwnProps = StackScreenProps<StackParamList, Screens.TransactionReview>
type Props = OwnProps & StateProps

const isTransferConfirmationCardProps = (
  confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
): confirmationProps is TransferConfirmationCardProps =>
  (confirmationProps as TransferConfirmationCardProps).type !== undefined

const hasAddressChanged = (
  confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
) => {
  if (!isTransferConfirmationCardProps(confirmationProps)) {
    return false
  }

  const { address, e164PhoneNumber } = confirmationProps
  if (!address || !e164PhoneNumber || !secureSendPhoneNumberMapping[e164PhoneNumber]) {
    return false
  }

  const newAddress = secureSendPhoneNumberMapping[e164PhoneNumber].address
  if (!newAddress || newAddress === address) {
    return false
  }

  return true
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { confirmationProps } = ownProps.route.params
  const { secureSendPhoneNumberMapping } = state.identity
  const addressHasChanged = hasAddressChanged(confirmationProps, secureSendPhoneNumberMapping)

  return { addressHasChanged }
}

function isExchange(
  confirmationProps: ExchangeConfirmationCardProps | TransferConfirmationCardProps
): confirmationProps is ExchangeConfirmationCardProps {
  return (confirmationProps as ExchangeConfirmationCardProps).makerAmount !== undefined
}

function TransactionReview({ navigation, route, addressHasChanged }: Props) {
  const {
    reviewProps: { type, timestamp },
    confirmationProps,
  } = route.params
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)

  useLayoutEffect(() => {
    const dateTimeStatus = getDatetimeDisplayString(timestamp, i18n)
    const header = isExchange(confirmationProps)
      ? exchangeReviewHeader(confirmationProps)
      : transferReviewHeader(type, confirmationProps, addressToDisplayName)

    navigation.setOptions({
      headerTitle: () => <HeaderTitleWithSubtitle title={header} subTitle={dateTimeStatus} />,
    })
  }, [type, confirmationProps, addressToDisplayName])

  if (isTransferConfirmationCardProps(confirmationProps)) {
    const props = { ...confirmationProps, addressHasChanged }
    return <TransferConfirmationCard {...props} />
  }

  return <ExchangeConfirmationCard {...confirmationProps} />
}

TransactionReview.navOptions = headerWithBackButton

export default connect<StateProps, {}, OwnProps, RootState>(mapStateToProps, {})(TransactionReview)
