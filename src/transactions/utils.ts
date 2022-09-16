import BigNumber from 'bignumber.js'
import { filter, find, forEach, map } from 'lodash'
import { useSelector } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import i18n from 'src/i18n'
import { AddressToDisplayNameType } from 'src/identity/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { localCurrencyToUsdSelector } from 'src/localCurrency/selectors'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenBalanceWithUsdPrice } from 'src/tokens/selectors'
import { FeedTokenTransaction } from 'src/transactions/feed/TransactionFeed'
import { TransferConfirmationCardProps } from 'src/transactions/TransferConfirmationCard'
import { TokenTransaction, TokenTransfer } from 'src/transactions/types'
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
      month: string
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
      month: formatFeedSectionTitle(item.timestamp, i18n),
      data: [],
    }
    sections[key].data.push(item)
    return sections
  }, sectionsMap)

  return Object.entries(sectionsMap)
    .sort((a, b) => a[1].daysSinceTransaction - b[1].daysSinceTransaction)
    .map(([key, value]) => ({
      title: key,
      month: value.month,
      data: value.data,
    }))
}

export const exchangeReviewHeader = (confirmationProps: ExchangeConfirmationCardProps) => {
  const { makerAmount } = confirmationProps
  const isSold = makerAmount.currencyCode === Currency.Celo
  return isSold ? i18n.t('soldGold') : i18n.t('purchasedGold')
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

export const filterTxByMonth = (
  transactions: FeedTokenTransaction[],
  month: string | undefined
) => {
  if (!month) return transactions
  return filter(transactions, (tx) => {
    const target = formatFeedSectionTitle(tx.timestamp, i18n)
    return target === month
  })
}

export const filterTxByAmount = (
  transactions: FeedTokenTransaction[],
  minAmount = Number.MIN_SAFE_INTEGER,
  maxAmount = Number.MAX_SAFE_INTEGER
) => {
  if (minAmount === Number.MIN_SAFE_INTEGER && maxAmount === Number.MAX_SAFE_INTEGER)
    return transactions
  return filter(transactions, (tx: TokenTransfer) => {
    const amount = Math.abs(tx.amount.localAmount?.value as number)
    return amount >= minAmount && amount <= maxAmount
  }) as FeedTokenTransaction[]
}

export const filterTxByRecipient = (
  transactions: FeedTokenTransaction[],
  recipient: string | undefined
) => {
  return recipient
    ? (filter(transactions, (tx: TokenTransfer) => {
        return tx.address === recipient
      }) as FeedTokenTransaction[])
    : transactions
}

export function calculateTransactionSubtotal(transactions: FeedTokenTransaction[]) {
  let total: BigNumber = new BigNumber(1)
  forEach(transactions, (transaction: FeedTokenTransaction) => {
    const transfer = transaction as TokenTransfer
    const tokenAmount = transfer.amount.value
    const tokenAddress = transfer.amount.tokenAddress
    const tokenInfo = useTokenInfo(tokenAddress)
    const localCurrencyExchangeRate = useSelector(localCurrencyToUsdSelector)
    const amountInUsd = tokenInfo?.usdPrice?.multipliedBy(tokenAmount)
    const amountInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
      amountInUsd ?? 0
    )
    total = total.plus(amountInLocalCurrency)
  })
  return formatValueToDisplay(total)
}

export const transactionsWithUsdPrice = (
  transactions: TokenTransaction[],
  tokenInfos: TokenBalanceWithUsdPrice[],
  localCurrencyCode: LocalCurrencyCode,
  localCurrencyExchangeRate: BigNumber
) => {
  const TAG = '@transactionsWithUsdPrice'
  return map(transactions, (tx: TokenTransfer) => {
    const tokenInfoWithUsdPrice = find(tokenInfos, (tokenInfo) => {
      return tokenInfo.address == tx.amount.tokenAddress
    }) as TokenBalanceWithUsdPrice
    const usdAmount = (tokenInfoWithUsdPrice?.usdPrice ?? new BigNumber(0)).multipliedBy(
      tx.amount.value
    )
    const localCurrencyAmount = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
      usdAmount
    )
    const result: TokenTransfer = {
      ...tx,
      amount: {
        ...tx.amount,
        localAmount: {
          value: localCurrencyAmount,
          exchangeRate: localCurrencyExchangeRate.toString(),
          currencyCode: localCurrencyCode,
        },
      },
    }
    return result
  })
}
