import { SwapTxsProperties } from 'src/analytics/Properties'
import { TokenBalances } from 'src/tokens/slice'
import { getTokenId } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import {
  TransactionRequest,
  getEstimatedGasFee,
  getFeeCurrency,
  getMaxGasFee,
} from 'src/viem/prepareTransactions'

export function getSwapTxsAnalyticsProperties(
  preparedTransactions: TransactionRequest[] | undefined,
  networkId: NetworkId,
  tokensById: TokenBalances
): SwapTxsProperties | null {
  if (!preparedTransactions) {
    return null
  }

  // undefined means the fee currency is the native currency
  const feeCurrency = getFeeCurrency(preparedTransactions)
  const feeCurrencyToken = tokensById[getTokenId(networkId, feeCurrency)]
  const maxGasFee = feeCurrencyToken
    ? getMaxGasFee(preparedTransactions).shiftedBy(-feeCurrencyToken.decimals)
    : undefined
  const maxGasFeeUsd =
    maxGasFee && feeCurrencyToken?.priceUsd ? maxGasFee.times(feeCurrencyToken.priceUsd) : undefined
  const estimatedGasFee = feeCurrencyToken
    ? getEstimatedGasFee(preparedTransactions).shiftedBy(-feeCurrencyToken.decimals)
    : undefined
  const estimatedGasFeeUsd =
    estimatedGasFee && feeCurrencyToken?.priceUsd
      ? estimatedGasFee.times(feeCurrencyToken.priceUsd)
      : undefined

  return {
    gas: Number(preparedTransactions.reduce((sum, tx) => sum + (tx.gas ?? BigInt(0)), BigInt(0))),
    maxGasFee: maxGasFee?.toNumber(),
    maxGasFeeUsd: maxGasFeeUsd?.toNumber(),
    estimatedGasFee: estimatedGasFee?.toNumber(),
    estimatedGasFeeUsd: estimatedGasFeeUsd?.toNumber(),
    feeCurrency,
    feeCurrencySymbol: feeCurrencyToken?.symbol,
    txCount: preparedTransactions.length,
  }
}
