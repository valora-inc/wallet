import { TokenTransactionType } from 'src/apollo/types'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import i18n from 'src/i18n'
import { AddressToDisplayNameType } from 'src/identity/reducer'
import { FeedItem } from 'src/transactions/TransactionFeed'
import { TransferConfirmationCardProps } from 'src/transactions/TransferConfirmationCard'
import { CURRENCIES, Currency } from 'src/utils/currencies'
import { formatFeedSectionTitle, timeDeltaInDays } from 'src/utils/time'

// Groupings:
// Recent -> Last 7 days.
// [Current month] - "July" -> Captures transactions from the current month that aren’t captured in Recent.
// [Previous months] - "June" -> Captures transactions by month.
// [Months over a year ago] — "July 2019" -> Same as above, but with year appended.
// Sections are hidden if they have no items.
export const groupFeedItemsInSections = (feedItems: FeedItem[]) => {
  const sectionsMap: {
    [key: string]: {
      data: FeedItem[]
      daysSinceTransaction: number
    }
  } = {}

  feedItems.reduce((sections, item) => {
    const daysSinceTransaction = timeDeltaInDays(Date.now(), item.timestamp)
    const key =
      daysSinceTransaction <= 7
        ? i18n.t('walletFlow5:feedSectionHeaderRecent')
        : formatFeedSectionTitle(item.timestamp, i18n)
    sections[key] = sections[key] || {
      daysSinceTransaction,
      data: [],
    }
    sections[key].data.push(item)
    return sections
  }, sectionsMap)

  return Object.entries(sectionsMap)
    .sort((a, b) => a[1].daysSinceTransaction - b[1].daysSinceTransaction)
    .map(([key, value]) => ({
      title: key,
      data: value.data,
    }))
}

export const exchangeReviewHeader = (confirmationProps: ExchangeConfirmationCardProps) => {
  const { makerAmount } = confirmationProps
  const isSold = makerAmount.currencyCode === CURRENCIES[Currency.Celo].code
  return isSold ? i18n.t('exchangeFlow9:soldGold') : i18n.t('exchangeFlow9:purchasedGold')
}

export const transferReviewHeader = (
  type: TokenTransactionType,
  confirmationProps: TransferConfirmationCardProps,
  addressToDisplayName: AddressToDisplayNameType
) => {
  let headerText = ''
  const isCeloTx = confirmationProps.amount.currencyCode === CURRENCIES[Currency.Celo].code
  switch (type) {
    case TokenTransactionType.Sent:
      headerText = i18n.t(
        isCeloTx ? 'walletFlow5:transactionHeaderWithdrewCelo' : 'walletFlow5:transactionHeaderSent'
      )
      break
    case TokenTransactionType.EscrowSent:
      headerText = i18n.t('walletFlow5:transactionHeaderEscrowSent')
      break
    case TokenTransactionType.Received:
      if (addressToDisplayName[confirmationProps.address || '']?.isCeloRewardSender) {
        headerText = i18n.t('walletFlow5:transactionHeaderCeloReward')
      }
      headerText = isCeloTx
        ? i18n.t('walletFlow5:transactionHeaderCeloDeposit')
        : i18n.t('walletFlow5:transactionHeaderReceived')
      break
    case TokenTransactionType.EscrowReceived:
      headerText = i18n.t('walletFlow5:transactionHeaderEscrowReceived')
      break
    case TokenTransactionType.VerificationFee:
      headerText = i18n.t('walletFlow5:transactionHeaderVerificationFee')
      break
    case TokenTransactionType.Faucet:
      headerText = i18n.t('walletFlow5:transactionHeaderFaucet')
      break
    case TokenTransactionType.InviteSent:
      headerText = i18n.t('walletFlow5:transactionHeaderInviteSent')
      break
    case TokenTransactionType.InviteReceived:
      headerText = i18n.t('walletFlow5:transactionHeaderInviteReceived')
      break
    case TokenTransactionType.NetworkFee:
      headerText = i18n.t('walletFlow5:transactionHeaderNetworkFee')
      break
  }

  return headerText
}
