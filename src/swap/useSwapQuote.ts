import BigNumber from 'bignumber.js'
import { useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useSelector } from 'react-redux'
import erc20 from 'src/abis/IERC20'
import { guaranteedSwapPriceEnabledSelector } from 'src/swap/selectors'
import { FetchQuoteResponse, Field, ParsedSwapAmount, SwapTransaction } from 'src/swap/types'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import {
  PreparedTransactionsResult,
  TransactionRequest,
  prepareTransactions,
} from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address, Hex, encodeFunctionData, zeroAddress } from 'viem'

// Apply a multiplier for the decreased swap amount to account for the
// varying gas fees of different swap providers (or even the same swap)
const DECREASED_SWAP_AMOUNT_GAS_FEE_MULTIPLIER = 1.2

export interface QuoteResult {
  toTokenId: string
  fromTokenId: string
  swapAmount: BigNumber
  price: string
  provider: string
  estimatedPriceImpact: BigNumber | null
  preparedTransactions?: PreparedTransactionsResult
  /**
   * @deprecated Temporary until we remove the swap review screen
   */
  rawSwapResponse: FetchQuoteResponse
  receivedAt: number
}

function createBaseSwapTransactions(
  fromToken: TokenBalance,
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction
) {
  const baseTransactions: TransactionRequest[] = []

  const { guaranteedPrice, buyAmount, sellAmount, allowanceTarget, from, to, value, data, gas } =
    unvalidatedSwapTransaction
  const amountType: string =
    updatedField === Field.TO ? ('buyAmount' as const) : ('sellAmount' as const)

  const amountToApprove =
    amountType === 'buyAmount'
      ? BigInt(new BigNumber(buyAmount).times(guaranteedPrice).toFixed(0, 0))
      : BigInt(sellAmount)

  // Approve transaction if the sell token is ERC-20
  if (allowanceTarget !== zeroAddress && fromToken.address) {
    const data = encodeFunctionData({
      abi: erc20.abi,
      functionName: 'approve',
      args: [allowanceTarget as Address, amountToApprove],
    })

    const approveTx: TransactionRequest = {
      from: from as Address,
      to: fromToken.address as Address,
      data,
    }
    baseTransactions.push(approveTx)
  }

  const swapTx: TransactionRequest & { gas: bigint } = {
    from: from as Address,
    to: to as Address,
    value: BigInt(value ?? 0),
    data: data as Hex,
    // This may not be entirely accurate for now
    // without the approval transaction being executed first.
    // See https://www.notion.so/valora-inc/Fee-currency-selection-logic-4c207244893748bd85e23b754334f42d?pvs=4#8b7c27d31ebf4fca981f81e9411f86ee
    // We control this from our API.
    gas: BigInt(gas),
  }
  baseTransactions.push(swapTx)

  return {
    amountToApprove,
    baseTransactions,
  }
}

export async function prepareSwapTransactions(
  fromToken: TokenBalance,
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction,
  price: string,
  feeCurrencies: TokenBalance[]
): Promise<PreparedTransactionsResult> {
  const { amountToApprove, baseTransactions } = createBaseSwapTransactions(
    fromToken,
    updatedField,
    unvalidatedSwapTransaction
  )
  return prepareTransactions({
    feeCurrencies,
    spendToken: fromToken,
    spendTokenAmount: new BigNumber(amountToApprove.toString()),
    decreasedAmountGasFeeMultiplier: DECREASED_SWAP_AMOUNT_GAS_FEE_MULTIPLIER,
    baseTransactions,
    // We still want to prepare the transactions even if the user doesn't have enough balance
    throwOnSpendTokenAmountExceedsBalance: false,
  })
}

function useSwapQuote(networkId: NetworkId, slippagePercentage: string) {
  const walletAddress = useSelector(walletAddressSelector)
  const useGuaranteedPrice = useSelector(guaranteedSwapPriceEnabledSelector)
  const [exchangeRate, setExchangeRate] = useState<QuoteResult | null>(null)
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, [networkId]))

  const refreshQuote = useAsyncCallback(
    async (
      fromToken: TokenBalance,
      toToken: TokenBalance,
      swapAmount: ParsedSwapAmount,
      updatedField: Field,
      shouldPrepareTransactions: boolean
    ) => {
      if (!swapAmount[updatedField].gt(0)) {
        return null
      }

      const decimals = updatedField === Field.FROM ? fromToken.decimals : toToken.decimals
      const swapAmountInWei = new BigNumber(swapAmount[updatedField]).shiftedBy(decimals)
      if (swapAmountInWei.lte(0)) {
        return null
      }

      const swapAmountParam = updatedField === Field.FROM ? 'sellAmount' : 'buyAmount'
      const params = {
        ...(toToken.address && { buyToken: toToken.address }),
        buyIsNative: (toToken.isNative ?? false).toString(),
        buyNetworkId: toToken.networkId,
        ...(fromToken.address && { sellToken: fromToken.address }),
        sellIsNative: (fromToken.isNative ?? false).toString(),
        sellNetworkId: fromToken.networkId,
        [swapAmountParam]: swapAmountInWei.toFixed(0, BigNumber.ROUND_DOWN),
        userAddress: walletAddress ?? '',
        slippagePercentage,
      }
      const queryParams = new URLSearchParams({ ...params }).toString()
      const requestUrl = `${networkConfig.getSwapQuoteUrl}?${queryParams}`
      const response = await fetch(requestUrl)

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const quote: FetchQuoteResponse = await response.json()
      const swapPrice = useGuaranteedPrice
        ? quote.unvalidatedSwapTransaction.guaranteedPrice
        : quote.unvalidatedSwapTransaction.price
      const price =
        updatedField === Field.FROM
          ? swapPrice
          : new BigNumber(1).div(new BigNumber(swapPrice)).toFixed()
      const estimatedPriceImpact = quote.unvalidatedSwapTransaction.estimatedPriceImpact
      const quoteResult: QuoteResult = {
        toTokenId: toToken.tokenId,
        fromTokenId: fromToken.tokenId,
        swapAmount: swapAmount[updatedField],
        price,

        provider: quote.details.swapProvider,
        estimatedPriceImpact: estimatedPriceImpact
          ? new BigNumber(estimatedPriceImpact).dividedBy(100)
          : null,
        rawSwapResponse: quote,
        receivedAt: Date.now(),
      }

      // TODO: this branch will be part of the normal flow once viem is always used
      if (shouldPrepareTransactions) {
        const preparedTransactions = await prepareSwapTransactions(
          fromToken,
          updatedField,
          quote.unvalidatedSwapTransaction,
          price,
          feeCurrencies
        )
        quoteResult.preparedTransactions = preparedTransactions
      }

      return quoteResult
    },
    {
      onSuccess: (updatedExchangeRate: QuoteResult | null) => {
        setExchangeRate(updatedExchangeRate)
      },
      onError: (error: Error) => {
        setExchangeRate(null)
        Logger.warn('SwapScreen@useSwapQuote', 'error from approve swap url', error)
      },
    }
  )

  const clearQuote = () => {
    setExchangeRate(null)
  }

  return {
    exchangeRate,
    refreshQuote: refreshQuote.execute,
    fetchSwapQuoteError: refreshQuote.status === 'error',
    fetchingSwapQuote: refreshQuote.loading,
    clearQuote,
  }
}

export default useSwapQuote
