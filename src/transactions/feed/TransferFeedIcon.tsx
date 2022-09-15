import React from 'react'
import { useSelector } from 'react-redux'
import ContactCircle from 'src/components/ContactCircle'
import CoinbasePayIcon from 'src/icons/CoinbasePayIcon'
import { coinbasePaySendersSelector } from 'src/recipients/reducer'
import { FeedTokenTransfer } from 'src/transactions/feed/TransferFeedItem'
import { useTransactionRecipient } from 'src/transactions/transferFeedUtils'
import { TokenTransactionTypeV2 } from 'src/transactions/types'

const AVATAR_SIZE = 40

interface Props {
  transfer: FeedTokenTransfer
}

export default function TransferFeedIcon({ transfer }: Props) {
  const { type, address } = transfer

  const coinbasePaySenders = useSelector(coinbasePaySendersSelector)
  const recipient = useTransactionRecipient(transfer)

  switch (type) {
    // Checks if feed item is a received transaction from Coinbase
    case TokenTransactionTypeV2.Received: {
      const isCoinbasePaySender = coinbasePaySenders.includes(address)

      if (isCoinbasePaySender) {
        return <CoinbasePayIcon />
      }
    }
    default: {
      return (
        <ContactCircle
          style={{ alignItems: 'flex-start' }}
          recipient={recipient}
          size={AVATAR_SIZE}
        />
      )
    }
  }
}
