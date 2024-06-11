import { QuoteResult } from 'src/swap/useSwapQuote'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'
import { getEstimatedGasFee } from 'src/viem/prepareTransactions'
import BigNumber from 'bignumber.js'
import { TokenBalance } from 'src/tokens/slice'
import { useSelector } from 'src/redux/hooks'

function useCrossChainFee(
  quote: QuoteResult | null,
  sourceNetworkId: NetworkId
): {
  crossChainFeeToken: TokenBalance
  maxCrossChainFeeAmount: BigNumber
  maxCrossChainFeeMissingAmountInDecimal: BigNumber
} {
  // Fee currencies arrays always have the native currency first, and cross chain
  // swap fees are always paid with the chain's native currency.
  const feeCurrency = useSelector((state) => feeCurrenciesSelector(state, sourceNetworkId))[0]

  if (quote?.unvalidatedSwapTransaction.type !== 'cross-chain') {
    return {
      crossChainFeeToken: feeCurrency,
      maxCrossChainFeeAmount: new BigNumber(0),
      maxCrossChainFeeMissingAmountInDecimal: new BigNumber(0),
    }
  }

  let gasNeededInCrossChainFeeCurrency = new BigNumber(0)

  // Gas is going to eat into our budget for the cross chain fee
  if (
    quote.preparedTransactions.type === 'possible' &&
    quote.preparedTransactions.feeCurrency.tokenId === feeCurrency.tokenId
  ) {
    gasNeededInCrossChainFeeCurrency = getEstimatedGasFee(quote.preparedTransactions.transactions)
  } else if (
    quote.preparedTransactions.type === 'need-decrease-spend-amount-for-gas' &&
    quote.preparedTransactions.feeCurrency.tokenId === feeCurrency.tokenId
  ) {
    gasNeededInCrossChainFeeCurrency = quote.preparedTransactions.maxGasFeeInDecimal.multipliedBy(
      new BigNumber(10).pow(feeCurrency.decimals)
    )
  }

  const maxCrossChainFee = new BigNumber(quote.unvalidatedSwapTransaction.maxCrossChainFee)

  let availableFeeCurrencyBalance = feeCurrency.balance
    .multipliedBy(new BigNumber(10).pow(feeCurrency.decimals))
    .minus(gasNeededInCrossChainFeeCurrency)

  // If we're selling the fee currency, the sell amount cannot be used to pay cross-chain fees
  if (quote.fromTokenId === feeCurrency.tokenId) {
    availableFeeCurrencyBalance = BigNumber.max(
      0,
      availableFeeCurrencyBalance.minus(new BigNumber(quote.unvalidatedSwapTransaction.sellAmount))
    )
  }

  return {
    crossChainFeeToken: feeCurrency,
    maxCrossChainFeeAmount: maxCrossChainFee,
    maxCrossChainFeeMissingAmountInDecimal: BigNumber.max(
      0,
      maxCrossChainFee.minus(availableFeeCurrencyBalance)
    ).dividedBy(new BigNumber(10).pow(feeCurrency.decimals)),
  }
}

export default useCrossChainFee
