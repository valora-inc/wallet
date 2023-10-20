import React from 'react'
import ContactCircle from 'src/components/ContactCircle'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import SwapIcon from 'src/icons/SwapIcon'
import { Recipient } from 'src/recipients/recipient'
import { TransactionStatus } from 'src/transactions/types'
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
      recipient: Recipient
    }

function TransactionFeedItemImage(props: Props) {
  const { status, transactionType } = props

  if (status === TransactionStatus.Failed) {
    // TODO
    return null
  }
  if (status === TransactionStatus.Pending) {
    return <GreenLoadingSpinner height={AVATAR_SIZE} />
  }
  if (transactionType === 'TokenExchangeV3') {
    return <SwapIcon />
  }

  if (transactionType === 'TokenTransferV3') {
    return <ContactCircle recipient={props.recipient} size={AVATAR_SIZE} />
  }

  // Should never happen
  Logger.error(
    'TransactionFeedItemImage',
    `Could not render image for transaction for transaction type ${transactionType} and status ${status}`
  )
  return null
}

export default TransactionFeedItemImage
