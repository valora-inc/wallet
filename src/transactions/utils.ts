import { CeloTxReceipt } from '@celo/connect'
import BigNumber from 'bignumber.js'
import i18n from 'src/i18n'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { getTokenId } from 'src/tokens/utils'
import { NetworkId, TokenTransaction, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { formatFeedSectionTitle, timeDeltaInDays } from 'src/utils/time'
import { select } from 'typed-redux-saga'
import { TransactionReceipt } from 'viem'

// Groupings:
// Recent -> Last 7 days (pending transactions always at the top, followed by recent confirmed transactions).
// [Current month] - "July" -> Captures transactions from the current month that aren’t captured in Recent.
// [Previous months] - "June" -> Captures transactions by month.
// [Months over a year ago] — "July 2019" -> Same as above, but with year appended.
// Sections are hidden if they have no items.
export function groupFeedItemsInSections(
  pendingTransactions: TokenTransaction[],
  confirmedTransactions: TokenTransaction[]
) {
  const sectionsMap: {
    [key: string]: {
      data: TokenTransaction[]
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

export function* buildBaseTransactionReceipt(
  receipt: TransactionReceipt | CeloTxReceipt,
  networkId: NetworkId
) {
  const tokensById = yield* select((state) => tokensByIdSelector(state, [networkId]))

  // Receipt gas information is based on the native token (there is no feeCurrency)
  const feeCurrencyId = getTokenId(networkId)
  const feeTokenInfo = tokensById[feeCurrencyId]

  const gasFeeInWei = new BigNumber(receipt.gasUsed.toString()).times(
    new BigNumber(receipt.effectiveGasPrice.toString())
  )

  if (!feeTokenInfo) {
    Logger.warn(`No information found for token ${feeCurrencyId}`)
  }

  const baseDetails = {
    status:
      receipt.status === 'reverted' || !receipt.status
        ? TransactionStatus.Failed
        : TransactionStatus.Complete,
    block: receipt.blockNumber.toString(),
    transactionHash: receipt.transactionHash,
  }
  const feeDetails = !feeTokenInfo
    ? {}
    : {
        feeCurrencyId: feeTokenInfo.tokenId,
        gasFee: gasFeeInWei.shiftedBy(-feeTokenInfo.decimals).toFixed(),
      }

  return {
    ...baseDetails,
    ...feeDetails,
  }
}
