import BigNumber from 'bignumber.js'
import { SwapFeeAmount } from 'src/swap/types'
import { TokenBalance } from 'src/tokens/slice'
import { getEstimatedGasFee, PreparedTransactionsResult } from 'src/viem/prepareTransactions'

function getCrossChainFee({
  feeCurrency,
  preparedTransactions,
  estimatedCrossChainFee,
  maxCrossChainFee,
  fromTokenId,
  sellAmount,
}: {
  feeCurrency?: TokenBalance
  preparedTransactions: PreparedTransactionsResult
  estimatedCrossChainFee: string
  maxCrossChainFee: string
  fromTokenId: string
  sellAmount: string
}):
  | (SwapFeeAmount & {
      nativeTokenBalanceDeficit: BigNumber
    })
  | undefined {
  if (!feeCurrency) return

  let networkFeeInNativeToken = new BigNumber(0)

  // Gas is going to eat into our budget for the cross chain fee
  if (
    preparedTransactions.type === 'possible' &&
    preparedTransactions.feeCurrency.tokenId === feeCurrency.tokenId
  ) {
    networkFeeInNativeToken = getEstimatedGasFee(preparedTransactions.transactions).shiftedBy(
      -feeCurrency.decimals
    )
  } else if (
    preparedTransactions.type === 'need-decrease-spend-amount-for-gas' &&
    preparedTransactions.feeCurrency.tokenId === feeCurrency.tokenId
  ) {
    networkFeeInNativeToken = preparedTransactions.maxGasFeeInDecimal
  }

  const maxCrossChainFeeAmount = new BigNumber(maxCrossChainFee).shiftedBy(-feeCurrency.decimals)

  return {
    maxAmount: maxCrossChainFeeAmount,
    amount: new BigNumber(estimatedCrossChainFee).shiftedBy(-feeCurrency.decimals),
    token: feeCurrency,
    nativeTokenBalanceDeficit: BigNumber.min(
      0,
      feeCurrency.balance
        .minus(networkFeeInNativeToken)
        .minus(maxCrossChainFeeAmount)
        .minus(
          fromTokenId === feeCurrency.tokenId
            ? new BigNumber(sellAmount).shiftedBy(-feeCurrency.decimals)
            : 0
        )
    ),
  }
}

export default getCrossChainFee
