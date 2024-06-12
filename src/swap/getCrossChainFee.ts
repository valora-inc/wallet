import { QuoteResult } from 'src/swap/useSwapQuote'
import { getEstimatedGasFee } from 'src/viem/prepareTransactions'
import BigNumber from 'bignumber.js'
import { TokenBalance } from 'src/tokens/slice'

function getCrossChainFee(
  quote: QuoteResult | null,
  feeCurrency?: TokenBalance
):
  | {
      maxCrossChainFeeAmount: BigNumber
      nativeTokenBalanceDeficit: BigNumber
    }
  | undefined {
  if (!quote || quote?.unvalidatedSwapTransaction.swapType !== 'cross-chain' || !feeCurrency) return

  let networkFeeInNativeToken = new BigNumber(0)

  // Gas is going to eat into our budget for the cross chain fee
  if (
    quote.preparedTransactions.type === 'possible' &&
    quote.preparedTransactions.feeCurrency.tokenId === feeCurrency.tokenId
  ) {
    networkFeeInNativeToken = getEstimatedGasFee(quote.preparedTransactions.transactions).shiftedBy(
      -feeCurrency.decimals
    )
  } else if (
    quote.preparedTransactions.type === 'need-decrease-spend-amount-for-gas' &&
    quote.preparedTransactions.feeCurrency.tokenId === feeCurrency.tokenId
  ) {
    networkFeeInNativeToken = quote.preparedTransactions.maxGasFeeInDecimal
  }

  const maxCrossChainFeeAmount = new BigNumber(
    quote.unvalidatedSwapTransaction.maxCrossChainFee
  ).shiftedBy(-feeCurrency.decimals)

  return {
    maxCrossChainFeeAmount,
    nativeTokenBalanceDeficit: BigNumber.min(
      0,
      feeCurrency.balance
        .minus(networkFeeInNativeToken)
        .minus(maxCrossChainFeeAmount)
        .minus(
          quote.fromTokenId === feeCurrency.tokenId
            ? new BigNumber(quote.unvalidatedSwapTransaction.sellAmount).shiftedBy(
                -feeCurrency.decimals
              )
            : 0
        )
    ),
  }
}

export default getCrossChainFee
