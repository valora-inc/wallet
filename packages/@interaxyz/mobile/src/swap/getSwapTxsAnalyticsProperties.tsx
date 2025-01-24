import { SwapTxsProperties } from 'src/analytics/Properties'
import { TokenBalances } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import {
  TransactionRequest,
  getEstimatedGasFee,
  getFeeCurrency,
  getFeeCurrencyToken,
  getFeeDecimals,
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

  const feeCurrencyToken = getFeeCurrencyToken(preparedTransactions, networkId, tokensById)
  const feeDecimals = feeCurrencyToken
    ? getFeeDecimals(preparedTransactions, feeCurrencyToken)
    : undefined
  const maxGasFee = feeDecimals
    ? getMaxGasFee(preparedTransactions).shiftedBy(-feeDecimals)
    : undefined
  const maxGasFeeUsd =
    maxGasFee && feeCurrencyToken?.priceUsd ? maxGasFee.times(feeCurrencyToken.priceUsd) : undefined
  const estimatedGasFee = feeDecimals
    ? getEstimatedGasFee(preparedTransactions).shiftedBy(-feeDecimals)
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
    feeCurrency: getFeeCurrency(preparedTransactions),
    feeCurrencySymbol: feeCurrencyToken?.symbol,
    txCount: preparedTransactions.length,
  }
}
