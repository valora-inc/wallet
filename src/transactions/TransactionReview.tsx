import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect } from 'react'
import { connect } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import i18n from 'src/i18n'
import { SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { addressToDisplayNameSelector } from 'src/identity/selectors'
import { HeaderTitleWithSubtitle, headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { allRewardsSendersSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import useSelector from 'src/redux/useSelector'
import TransferConfirmationCard, {
  TransferConfirmationCardProps,
} from 'src/transactions/TransferConfirmationCard'
import { transferReviewHeader } from 'src/transactions/utils'
import { getDatetimeDisplayString } from 'src/utils/time'

interface StateProps {
  addressHasChanged: boolean
}
export interface ReviewProps {
  type: TokenTransactionType
  timestamp: number
}

type OwnProps = NativeStackScreenProps<StackParamList, Screens.TransactionReview>
type Props = OwnProps & StateProps

const isTransferConfirmationCardProps = (
  confirmationProps: TransferConfirmationCardProps
): confirmationProps is TransferConfirmationCardProps =>
  (confirmationProps as TransferConfirmationCardProps).type !== undefined

const hasAddressChanged = (
  confirmationProps: TransferConfirmationCardProps,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
) => {
  if (!isTransferConfirmationCardProps(confirmationProps)) {
    return false
  }

  const { address, e164PhoneNumber } = confirmationProps.recipient
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

function TransactionReview({ navigation, route, addressHasChanged }: Props) {
  const {
    reviewProps: { type, timestamp },
    confirmationProps,
  } = route.params
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(allRewardsSendersSelector)

  useLayoutEffect(() => {
    const dateTimeStatus = getDatetimeDisplayString(timestamp, i18n)
    const header = transferReviewHeader(
      type,
      confirmationProps,
      addressToDisplayName,
      rewardsSenders
    )

    navigation.setOptions({
      headerTitle: () => <HeaderTitleWithSubtitle title={header} subTitle={dateTimeStatus} />,
    })
  }, [type, confirmationProps, addressToDisplayName])

  const props = { ...confirmationProps, addressHasChanged }
  return <TransferConfirmationCard {...props} />
}

TransactionReview.navOptions = headerWithBackButton

export default connect<StateProps, {}, OwnProps, RootState>(mapStateToProps, {})(TransactionReview)
