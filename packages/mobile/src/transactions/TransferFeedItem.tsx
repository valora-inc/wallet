import gql from 'graphql-tag'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType, TransferItemFragment } from 'src/apollo/types'
import { txHashToFeedInfoSelector } from 'src/fiatExchanges/reducer'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { addressToDisplayNameSelector } from 'src/identity/selectors'
import { getRecipientFromAddress, NumberToRecipient, RecipientInfo } from 'src/recipients/recipient'
import { inviteRewardsSendersSelector, rewardsSendersSelector } from 'src/recipients/reducer'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import TransactionFeedItem from 'src/transactions/TransactionFeedItem'
import TransferFeedIcon from 'src/transactions/TransferFeedIcon'
import {
  getDecryptedTransferFeedComment,
  getTransferFeedParams,
} from 'src/transactions/transferFeedUtils'
import { TransactionStatus } from 'src/transactions/types'

type Props = TransferItemFragment & {
  type: TokenTransactionType
  status: TransactionStatus
  addressToE164Number: AddressToE164NumberType
  phoneRecipientCache: NumberToRecipient
  recentTxRecipientsCache: NumberToRecipient
  commentKey: string | null
  recipientInfo: RecipientInfo
}

function navigateToTransactionReview({
  address,
  type,
  comment,
  commentKey,
  timestamp,
  amount,
  recipientInfo,
  defaultName,
  defaultImage,
}: Props) {
  // TODO: remove this when verification reward drilldown is supported
  if (type === TokenTransactionType.VerificationReward) {
    return
  }

  const recipient = getRecipientFromAddress(address, recipientInfo, defaultName, defaultImage)

  navigateToPaymentTransferReview(type, timestamp, {
    comment: getDecryptedTransferFeedComment(comment, commentKey, type),
    amount,
    recipient,
    type,
    // fee TODO: add fee here.
  })
}

export function TransferFeedItem(props: Props) {
  const { t } = useTranslation()
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(rewardsSendersSelector)
  const inviteRewardSenders = useSelector(inviteRewardsSendersSelector)
  const txHashToFeedInfo = useSelector(txHashToFeedInfoSelector)

  const onPress = () => {
    navigateToTransactionReview(props)
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  const {
    amount,
    address,
    timestamp,
    type,
    hash,
    comment,
    commentKey,
    status,
    addressToE164Number,
    phoneRecipientCache,
    recentTxRecipientsCache,
    recipientInfo,
    defaultName,
    defaultImage,
  } = props

  const { title, info, recipient } = getTransferFeedParams(
    type,
    t,
    phoneRecipientCache,
    recentTxRecipientsCache,
    address,
    addressToE164Number,
    comment,
    commentKey,
    timestamp,
    recipientInfo,
    addressToDisplayName[address]?.isCeloRewardSender ?? false,
    rewardsSenders.includes(address),
    inviteRewardSenders.includes(address),
    txHashToFeedInfo[hash],
    amount.currencyCode,
    defaultName || undefined,
    defaultImage || undefined
  )

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
      defaultName
      defaultImage
    }
  `,
}

export default TransferFeedItem
