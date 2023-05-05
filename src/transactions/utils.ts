import { TokenTransactionType } from 'src/apollo/types'
import i18n from 'src/i18n'
import { AddressToDisplayNameType } from 'src/identity/reducer'
import { TransferConfirmationCardProps } from 'src/transactions/TransferConfirmationCard'
import { Currency } from 'src/utils/currencies'
import { formatFeedSectionTitle, timeDeltaInDays } from 'src/utils/time'

// Groupings:
// Recent -> Last 7 days.
// [Current month] - "July" -> Captures transactions from the current month that aren’t captured in Recent.
// [Previous months] - "June" -> Captures transactions by month.
// [Months over a year ago] — "July 2019" -> Same as above, but with year appended.
// Sections are hidden if they have no items.
export function groupFeedItemsInSections<T extends { timestamp: number }>(items: T[]) {
  const sectionsMap: {
    [key: string]: {
      data: T[]
      daysSinceTransaction: number
    }
  } = {}

  items.reduce((sections, item) => {
    const daysSinceTransaction = timeDeltaInDays(Date.now(), item.timestamp)
    const key =
      daysSinceTransaction <= 7
        ? i18n.t('feedSectionHeaderRecent')
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

export const transferReviewHeader = (
  type: TokenTransactionType,
  confirmationProps: TransferConfirmationCardProps,
  addressToDisplayName: AddressToDisplayNameType,
  rewardsSenders: string[]
) => {
  let headerText = ''
  const isCeloTx = confirmationProps.amount.currencyCode === Currency.Celo
  switch (type) {
    case TokenTransactionType.Sent:
      headerText = i18n.t(isCeloTx ? 'transactionHeaderWithdrewCelo' : 'transactionHeaderSent')
      break
    case TokenTransactionType.EscrowSent:
      headerText = i18n.t('transactionHeaderEscrowSent')
      break
    case TokenTransactionType.Received:
      const address = confirmationProps.address ?? ''
      if (rewardsSenders.includes(address) || addressToDisplayName[address]?.isCeloRewardSender) {
        headerText = i18n.t('transactionHeaderCeloReward')
      } else {
        headerText = isCeloTx
          ? i18n.t('transactionHeaderCeloDeposit')
          : i18n.t('transactionHeaderReceived')
      }
      break
    case TokenTransactionType.EscrowReceived:
      headerText = i18n.t('transactionHeaderEscrowReceived')
      break
    case TokenTransactionType.VerificationFee:
      headerText = i18n.t('transactionHeaderVerificationFee')
      break
    case TokenTransactionType.Faucet:
      headerText = i18n.t('transactionHeaderFaucet')
      break
    case TokenTransactionType.InviteSent:
      headerText = i18n.t('transactionHeaderInviteSent')
      break
    case TokenTransactionType.InviteReceived:
      headerText = i18n.t('transactionHeaderInviteReceived')
      break
    case TokenTransactionType.NetworkFee:
      headerText = i18n.t('transactionHeaderNetworkFee')
      break
  }

  return headerText
}
