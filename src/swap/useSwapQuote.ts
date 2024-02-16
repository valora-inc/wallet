import BigNumber from 'bignumber.js'
import { useAsyncCallback } from 'react-async-hook'
import erc20 from 'src/abis/IERC20'
import useSelector from 'src/redux/useSelector'
import { FetchQuoteResponse, Field, ParsedSwapAmount, SwapTransaction } from 'src/swap/types'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import {
  PreparedTransactionsResult,
  TransactionRequest,
  prepareTransactions,
} from 'src/viem/prepareTransactions'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
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
  estimatedPriceImpact: string | null
  allowanceTarget: string
  preparedTransactions: PreparedTransactionsResult
  receivedAt: number
}

async function createBaseSwapTransactions(
  fromToken: TokenBalance,
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction,
  walletAddress: string
) {
  const baseTransactions: TransactionRequest[] = []

  const {
    guaranteedPrice,
    buyAmount,
    sellAmount,
    allowanceTarget,
    from,
    to,
    value,
    data,
    gas,
    estimatedGasUse,
  } = unvalidatedSwapTransaction
  const amountType: string =
    updatedField === Field.TO ? ('buyAmount' as const) : ('sellAmount' as const)

  const amountToApprove =
    amountType === 'buyAmount'
      ? BigInt(new BigNumber(buyAmount).times(guaranteedPrice).toFixed(0, 0))
      : BigInt(sellAmount)

  // If the sell token is ERC-20, we need to check the allowance and add an
  // approval transaction if necessary
  if (allowanceTarget !== zeroAddress && fromToken.address) {
    const approvedAllowanceForSpender = await publicClient[
      networkIdToNetwork[fromToken.networkId]
    ].readContract({
      address: fromToken.address as Address,
      abi: erc20.abi,
      functionName: 'allowance',
      args: [walletAddress as Address, allowanceTarget as Address],
    })

    if (approvedAllowanceForSpender < amountToApprove) {
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
    // This is the estimated gas use returned by the API.
    _estimatedGasUse: estimatedGasUse != null ? BigInt(estimatedGasUse) : undefined,
  }
  baseTransactions.push(swapTx)

  return {
    amountToApprove,
    baseTransactions,
  }
}

async function prepareSwapTransactions(
  fromToken: TokenBalance,
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction,
  feeCurrencies: TokenBalance[],
  walletAddress: string
): Promise<PreparedTransactionsResult> {
  const { amountToApprove, baseTransactions } = await createBaseSwapTransactions(
    fromToken,
    updatedField,
    unvalidatedSwapTransaction,
    walletAddress
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
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, networkId))

  const refreshQuote = useAsyncCallback(
    async (
      fromToken: TokenBalance,
      toToken: TokenBalance,
      swapAmount: ParsedSwapAmount,
      updatedField: Field
    ): Promise<QuoteResult | null> => {
      if (!walletAddress) {
        // should never happen
        Logger.error('SwapScreen@useSwapQuote', 'No wallet address found when refreshing quote')
        return null
      }

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
      const swapPrice = quote.unvalidatedSwapTransaction.price
      const price =
        updatedField === Field.FROM
          ? swapPrice
          : new BigNumber(1).div(new BigNumber(swapPrice)).toFixed()
      const estimatedPriceImpact = quote.unvalidatedSwapTransaction.estimatedPriceImpact
      const preparedTransactions = await prepareSwapTransactions(
        fromToken,
        updatedField,
        quote.unvalidatedSwapTransaction,
        feeCurrencies,
        walletAddress
      )
      const quoteResult: QuoteResult = {
        toTokenId: toToken.tokenId,
        fromTokenId: fromToken.tokenId,
        swapAmount: swapAmount[updatedField],
        price,
        provider: quote.details.swapProvider,
        estimatedPriceImpact,
        allowanceTarget: quote.unvalidatedSwapTransaction.allowanceTarget,
        preparedTransactions,
        receivedAt: Date.now(),
      }

      return quoteResult
    },
    {
      // Keep last result when refreshing
      setLoading: (state) => ({ ...state, loading: true }),
      onError: (error: Error) => {
        Logger.warn('SwapScreen@useSwapQuote', 'error from approve swap url', error)
      },
    }
  )

  const clearQuote = () => {
    refreshQuote.reset()
  }

  return {
    quote: refreshQuote.result ?? null,
    refreshQuote: refreshQuote.execute,
    fetchSwapQuoteError: refreshQuote.status === 'error',
    fetchingSwapQuote: refreshQuote.loading,
    clearQuote,
  }
}

export default useSwapQuote
