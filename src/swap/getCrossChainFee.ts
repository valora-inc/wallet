import BigNumber from 'bignumber.js'
import { SwapFeeAmount } from 'src/swap/types'
import { QuoteResult } from 'src/swap/useSwapQuote'
import { TokenBalance } from 'src/tokens/slice'
import { getEstimatedGasFee } from 'src/viem/prepareTransactions'

function getCrossChainFee(
  quote: QuoteResult | null,
  feeCurrency?: TokenBalance
):
  | (SwapFeeAmount & {
      nativeTokenBalanceDeficit: BigNumber
    })
  | undefined {
  if (!quote || quote?.swapType !== 'cross-chain' || !feeCurrency) return

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

  const maxCrossChainFeeAmount = new BigNumber(quote.maxCrossChainFee).shiftedBy(
    -feeCurrency.decimals
  )

  return {
    maxAmount: maxCrossChainFeeAmount,
    amount: new BigNumber(quote.estimatedCrossChainFee).shiftedBy(-feeCurrency.decimals),
    token: feeCurrency,
    nativeTokenBalanceDeficit: BigNumber.min(
      0,
      feeCurrency.balance
        .minus(networkFeeInNativeToken)
        .minus(maxCrossChainFeeAmount)
        .minus(
          quote.fromTokenId === feeCurrency.tokenId
            ? new BigNumber(quote.sellAmount).shiftedBy(-feeCurrency.decimals)
            : 0
        )
    ),
  }
}

export default getCrossChainFee
