import React from 'react'
import ContactCircle from 'src/components/ContactCircle'
import Activity from 'src/icons/Activity'
import AttentionIcon from 'src/icons/Attention'
import CircledIcon from 'src/icons/CircledIcon'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import JumpstartIcon from 'src/icons/JumpstartIcon'
import SwapIcon from 'src/icons/SwapIcon'
import { Recipient } from 'src/recipients/recipient'
import Colors from 'src/styles/colors'
import { TokenTransactionTypeV2, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'

const AVATAR_SIZE = 40

type Props =
  | {
      status: TransactionStatus
      transactionType: 'TokenExchangeV3'
    }
  | {
      status: TransactionStatus
      transactionType: 'TokenTransferV3'
      transactionSubtype: TokenTransactionTypeV2
      recipient: Recipient
    }
  | {
      status: TransactionStatus
      transactionType: 'TokenApproval'
    }
  | {
      status: TransactionStatus
      transactionType: 'JumpstartDeposit'
    }

function TransactionFeedItemImage(props: Props) {
  const { status, transactionType } = props

  if (status === TransactionStatus.Failed) {
    return (
      <CircledIcon backgroundColor={Colors.errorLight} radius={AVATAR_SIZE}>
        <AttentionIcon color={Colors.errorDark} size={24} testId={'FailedTransactionAlert'} />
      </CircledIcon>
    )
  }
  if (status === TransactionStatus.Pending) {
    return <GreenLoadingSpinner height={AVATAR_SIZE} />
  }
  if (transactionType === 'TokenExchangeV3') {
    return <SwapIcon />
  }
  if (transactionType === 'TokenApproval') {
    return (
      <CircledIcon backgroundColor={Colors.successLight} radius={AVATAR_SIZE}>
        <Activity />
      </CircledIcon>
    )
  }
  if (transactionType === 'TokenTransferV3') {
    switch (props.transactionSubtype) {
      case TokenTransactionTypeV2.JumpstartReceived:
      case TokenTransactionTypeV2.JumpstartReclaimed:
        return <JumpstartIcon />
      default:
        return <ContactCircle recipient={props.recipient} size={AVATAR_SIZE} />
    }
  }
  if (transactionType === 'JumpstartDeposit') {
    return <JumpstartIcon />
  }

  // Should never happen
  Logger.error(
    'TransactionFeedItemImage',
    `Could not render image for transaction for transaction type ${transactionType} and status ${status}`
  )
  return null
}

export default TransactionFeedItemImage
