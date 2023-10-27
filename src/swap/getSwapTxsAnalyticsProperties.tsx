import BigNumber from 'bignumber.js'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import { SwapTxsProperties } from 'src/analytics/Properties'
import { getFeeCurrency } from 'src/swap/getFeeCurrency'
import { TokenBalancesWithAddress } from 'src/tokens/slice'
import { getMaxGasCost } from 'src/viem/prepareTransactions'

export function getSwapTxsAnalyticsProperties(
  preparedTransactions: TransactionRequestCIP42[] | undefined,
  tokensByAddress: TokenBalancesWithAddress,
  celoAddress: string | undefined
): SwapTxsProperties | null {
  if (!preparedTransactions) {
    return null
  }

  // undefined means the fee currency is the native currency
  const feeCurrency = getFeeCurrency(preparedTransactions)
  const maxGasCost = getMaxGasCost(preparedTransactions)

  const feeCurrencyAddress = feeCurrency || celoAddress
  const feeCurrencyToken = feeCurrencyAddress ? tokensByAddress[feeCurrencyAddress] : undefined
  const maxGasCostUsd = feeCurrencyToken?.priceUsd
    ? new BigNumber(maxGasCost.toString())
        .shiftedBy(-feeCurrencyToken.decimals)
        .times(feeCurrencyToken.priceUsd)
    : undefined

  return {
    maxGasCost: Number(maxGasCost),
    maxGasCostUsd: maxGasCostUsd?.toNumber(),
    feeCurrency,
    feeCurrencySymbol: feeCurrencyToken?.symbol,
    txCount: preparedTransactions.length,
  }
}
