import React from 'react'
import ContactCircle from 'src/components/ContactCircle'
import IconWithNetworkBadge from 'src/components/IconWithNetworkBadge'
import Activity from 'src/icons/Activity'
import AttentionIcon from 'src/icons/Attention'
import CircledIcon from 'src/icons/CircledIcon'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import MagicWand from 'src/icons/MagicWand'
import SwapIcon from 'src/icons/SwapIcon'
import UpwardGraph from 'src/icons/UpwardGraph'
import { Recipient } from 'src/recipients/recipient'
import Colors from 'src/styles/colors'
import { NetworkId, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'

const AVATAR_SIZE = 40

type Props = { networkId: NetworkId; status: TransactionStatus } & (
  | {
      transactionType: 'TokenExchangeV3'
    }
  | {
      transactionType: 'TokenTransferV3'
      recipient: Recipient
      isJumpstart: boolean
    }
  | {
      transactionType: 'TokenApproval'
    }
  | {
      transactionType: 'EarnDeposit' | 'EarnWithdraw' | 'EarnClaimReward'
    }
)

function TransactionFeedItemBaseImage(props: Props) {
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
    if (props.isJumpstart) {
      return (
        <CircledIcon backgroundColor={Colors.successLight} radius={AVATAR_SIZE}>
          <MagicWand size={24} />
        </CircledIcon>
      )
    }

    return <ContactCircle recipient={props.recipient} size={AVATAR_SIZE} />
  }

  if (['EarnWithdraw', 'EarnDeposit', 'EarnClaimReward'].includes(transactionType)) {
    return (
      <CircledIcon backgroundColor={Colors.successLight} radius={AVATAR_SIZE}>
        <UpwardGraph size={30} color={Colors.successDark} />
      </CircledIcon>
    )
  }

  // Should never happen
  Logger.error(
    'TransactionFeedItemImage',
    `Could not render image for transaction for transaction type ${transactionType} and status ${status}`
  )
  return null
}

function TransactionFeedItemImage(props: Props) {
  return (
    <IconWithNetworkBadge networkId={props.networkId}>
      <TransactionFeedItemBaseImage {...props} />
    </IconWithNetworkBadge>
  )
}

export default TransactionFeedItemImage
