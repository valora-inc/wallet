import gql from 'graphql-tag'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType, TransferItemFragment } from 'src/apollo/types'
import { txHashToFeedInfoSelector } from 'src/fiatExchanges/reducer'
import { Namespaces } from 'src/i18n'
import { addressToE164NumberSelector } from 'src/identity/reducer'
import { Recipient } from 'src/recipients/recipient'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import TransactionFeedItem from 'src/transactions/TransactionFeedItem'
import TransferFeedIcon from 'src/transactions/TransferFeedIcon'
import {
  getDecryptedTransferFeedComment,
  useRecipient,
  useTransferFeedParams,
} from 'src/transactions/transferFeedUtils'
import { TransactionStatus } from 'src/transactions/types'

type Props = TransferItemFragment & {
  type: TokenTransactionType
  status: TransactionStatus
  commentKey: string | null
}

function navigateToTransactionReview({
  address,
  type,
  comment,
  commentKey,
  timestamp,
  amount,
  recipient,
  isBalanceReward,
  isInviteReward,
}: Props & { recipient: Recipient }) {
  // TODO: remove this when verification reward drilldown is supported
  if (type === TokenTransactionType.VerificationReward) {
    return
  }

  navigateToPaymentTransferReview(type, timestamp, {
    address,
    comment: getDecryptedTransferFeedComment(comment, commentKey, type),
    amount,
    recipient,
    type,
    isReward: isBalanceReward || isInviteReward,
    // fee TODO: add fee here.
  })
}

export function TransferFeedItem(props: Props) {
  const { t } = useTranslation(Namespaces.walletFlow5)
  const addressToE164Number = useSelector(addressToE164NumberSelector)
  const txHashToFeedInfo = useSelector(txHashToFeedInfoSelector)

  const {
    amount,
    address,
    timestamp,
    type,
    hash,
    comment,
    commentKey,
    status,
    isBalanceReward,
    isInviteReward,
    name,
    imageUrl,
  } = props
  const isReward = isBalanceReward || isInviteReward
  const txInfo = txHashToFeedInfo[hash]

  const e164PhoneNumber = addressToE164Number[address]
  const recipient = useRecipient(
    type,
    e164PhoneNumber,
    timestamp,
    address,
    txInfo,
    isReward,
    name,
    imageUrl
  )
  Object.assign(recipient, { address })

  const { title, info } = useTransferFeedParams(type, t, recipient, comment, commentKey, isReward)

  const onPress = () => {
    navigateToTransactionReview({ ...props, recipient })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  return (
    <TransactionFeedItem
      type={type}
      amount={amount}
      title={title}
      info={info}
      icon={<TransferFeedIcon type={type} recipient={recipient} />}
      timestamp={timestamp}
      status={status}
      onPress={onPress}
    />
  )
}

TransferFeedItem.fragments = {
  transfer: gql`
    fragment TransferItem on TokenTransfer {
      __typename
      type
      hash
      amount {
        value
        currencyCode
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      timestamp
      address
      account
      comment
      isBalanceReward
      isInviteReward
      name
      imageUrl
    }
  `,
}

export default TransferFeedItem
