import BigNumber from 'bignumber.js'
import { PrefixedTxReceiptProperties, TxReceiptProperties } from 'src/analytics/Properties'
import i18n from 'src/i18n'
import { TokenBalances } from 'src/tokens/slice'
import { NetworkId, TrackedTx } from 'src/transactions/types'
import { formatFeedSectionTitle, timeDeltaInDays } from 'src/utils/time'
import {
  getEstimatedGasFee,
  getFeeCurrency,
  getFeeCurrencyToken,
  getFeeDecimals,
  getMaxGasFee,
} from 'src/viem/prepareTransactions'

// Groupings:
// Recent -> Last 7 days (pending transactions always at the top, followed by recent confirmed transactions).
// [Current month] - "July" -> Captures transactions from the current month that aren’t captured in Recent.
// [Previous months] - "June" -> Captures transactions by month.
// [Months over a year ago] — "July 2019" -> Same as above, but with year appended.
// Sections are hidden if they have no items.
export function groupFeedItemsInSections<T extends { timestamp: number }>(
  pendingTransactions: T[],
  confirmedTransactions: T[]
) {
  const sectionsMap: {
    [key: string]: {
      data: T[]
      daysSinceTransaction: number
    }
  } = {}

  // add standby transactions to top of recent section
  const recentSectionTitle = i18n.t('feedSectionHeaderRecent')
  if (pendingTransactions.length > 0) {
    sectionsMap[recentSectionTitle] = {
      daysSinceTransaction: 0,
      data: pendingTransactions,
    }
  }

  confirmedTransactions.forEach((transaction) => {
    const daysSinceTransaction = timeDeltaInDays(Date.now(), transaction.timestamp)
    const sectionTitle =
      daysSinceTransaction <= 7
        ? i18n.t('feedSectionHeaderRecent')
        : formatFeedSectionTitle(transaction.timestamp, i18n)
    sectionsMap[sectionTitle] = {
      daysSinceTransaction: sectionsMap[sectionTitle]?.daysSinceTransaction ?? daysSinceTransaction,
      data: [...(sectionsMap[sectionTitle]?.data ?? []), transaction],
    }
  })

  return Object.entries(sectionsMap)
    .sort((a, b) => a[1].daysSinceTransaction - b[1].daysSinceTransaction)
    .map(([key, value]) => ({
      title: key,
      data: value.data,
    }))
}

export function getTxReceiptAnalyticsProperties(
  { tx, txHash, txReceipt }: TrackedTx,
  networkId: NetworkId,
  tokensById: TokenBalances
): Partial<TxReceiptProperties> {
  const feeCurrencyToken = tx && getFeeCurrencyToken([tx], networkId, tokensById)
  const feeDecimals = tx && feeCurrencyToken ? getFeeDecimals([tx], feeCurrencyToken) : undefined

  const txMaxGasFee = tx && feeDecimals ? getMaxGasFee([tx]).shiftedBy(-feeDecimals) : undefined
  const txMaxGasFeeUsd =
    feeCurrencyToken && txMaxGasFee && feeCurrencyToken.priceUsd
      ? txMaxGasFee.times(feeCurrencyToken.priceUsd)
      : undefined
  const txEstimatedGasFee =
    tx && feeDecimals ? getEstimatedGasFee([tx]).shiftedBy(-feeDecimals) : undefined
  const txEstimatedGasFeeUsd =
    feeCurrencyToken && txEstimatedGasFee && feeCurrencyToken.priceUsd
      ? txEstimatedGasFee.times(feeCurrencyToken.priceUsd)
      : undefined

  const txGasFee =
    txReceipt?.gasUsed && txReceipt?.effectiveGasPrice && feeDecimals
      ? new BigNumber((txReceipt.gasUsed * txReceipt.effectiveGasPrice).toString()).shiftedBy(
          -feeDecimals
        )
      : undefined
  const txGasFeeUsd =
    feeCurrencyToken && txGasFee && feeCurrencyToken.priceUsd
      ? txGasFee.times(feeCurrencyToken.priceUsd)
      : undefined

  return {
    txCumulativeGasUsed: txReceipt?.cumulativeGasUsed
      ? Number(txReceipt.cumulativeGasUsed)
      : undefined,
    txEffectiveGasPrice: txReceipt?.effectiveGasPrice
      ? Number(txReceipt.effectiveGasPrice)
      : undefined,
    txGas: tx?.gas ? Number(tx.gas) : undefined,
    txMaxGasFee: txMaxGasFee?.toNumber(),
    txMaxGasFeeUsd: txMaxGasFeeUsd?.toNumber(),
    txEstimatedGasFee: txEstimatedGasFee?.toNumber(),
    txEstimatedGasFeeUsd: txEstimatedGasFeeUsd?.toNumber(),
    txGasUsed: txReceipt?.gasUsed ? Number(txReceipt.gasUsed) : undefined,
    txGasFee: txGasFee?.toNumber(),
    txGasFeeUsd: txGasFeeUsd?.toNumber(),
    txHash,
    txFeeCurrency: tx && getFeeCurrency(tx),
    txFeeCurrencySymbol: feeCurrencyToken?.symbol,
  }
}

export function getPrefixedTxAnalyticsProperties<Prefix extends string>(
  receiptProperties: Partial<TxReceiptProperties>,
  prefix: Prefix
): Partial<PrefixedTxReceiptProperties<Prefix>> {
  const prefixedProperties: Record<string, any> = {}
  for (const [key, value] of Object.entries(receiptProperties)) {
    prefixedProperties[`${prefix}${key[0].toUpperCase()}${key.slice(1)}`] = value
  }
  return prefixedProperties as Partial<PrefixedTxReceiptProperties<Prefix>>
}
