import BigNumber from 'bignumber.js'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import { useRef, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useSelector } from 'react-redux'
import erc20 from 'src/abis/IERC20'
import { STATIC_GAS_PADDING } from 'src/config'
import { useFeeCurrencies } from 'src/fees/hooks'
import { guaranteedSwapPriceEnabledSelector } from 'src/swap/selectors'
import { FetchQuoteResponse, Field, ParsedSwapAmount, SwapTransaction } from 'src/swap/types'
import { TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address, EstimateGasExecutionError, Hex, encodeFunctionData, zeroAddress } from 'viem'

// Apply a multiplier for the decreased swap amount to account for the
// varying gas costs of different swap providers (or even the same swap)
const DECREASED_SWAP_AMOUNT_GAS_COST_MULTIPLIER = 1.2

export interface QuoteResult {
  toTokenAddress: string
  fromTokenAddress: string
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

interface PreparedTransactionsPossible {
  type: 'possible'
  transactions: TransactionRequestCIP42[]
}

export interface PreparedTransactionsNeedDecreaseSwapAmountForGas {
  type: 'need-decrease-swap-amount-for-gas'
  maxGasCost: BigNumber
  feeCurrency: TokenBalance
  decreasedSwapAmount: BigNumber
}

export interface PreparedTransactionsNotEnoughBalanceForGas {
  type: 'not-enough-balance-for-gas'
  feeCurrencies: TokenBalance[]
}

export type PreparedTransactionsResult =
  | PreparedTransactionsPossible
  | PreparedTransactionsNeedDecreaseSwapAmountForGas
  | PreparedTransactionsNotEnoughBalanceForGas

function createBaseTransactions(
  fromToken: TokenBalanceWithAddress,
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction
) {
  const baseTransactions: TransactionRequestCIP42[] = []

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

    const approveTx: TransactionRequestCIP42 = {
      from: from as Address,
      to: fromToken.address as Address,
      data,
    }
    baseTransactions.push(approveTx)
  }

  const swapTx: TransactionRequestCIP42 & { gas: bigint } = {
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

function getFeeCurrencyAddress(feeCurrency: TokenBalance) {
  return !feeCurrency.isNative ? (feeCurrency.address as Address) : undefined
}

async function tryEstimateTransactions(
  baseTransactions: TransactionRequestCIP42[],
  feeCurrency: TokenBalance
) {
  const transactions: TransactionRequestCIP42[] = []

  const feeCurrencyAddress = getFeeCurrencyAddress(feeCurrency)
  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(
    publicClient.celo,
    feeCurrencyAddress
  )

  for (const [index, baseTx] of baseTransactions.entries()) {
    // We can only truly estimate the gas for the first transaction
    if (index === 0) {
      const tx = await tryEstimateTransaction(
        baseTx,
        feeCurrency,
        maxFeePerGas,
        maxPriorityFeePerGas
      )
      if (!tx) {
        return null
      }
      transactions.push(tx)
    } else {
      if (!baseTx.gas) {
        throw new Error(
          'When multiple transactions are provided, all transactions but the first one must have a gas value'
        )
      }
      transactions.push({
        ...baseTx,
        maxFeePerGas,
        maxPriorityFeePerGas,
        // Don't include the feeCurrency field if not present.
        // See https://github.com/wagmi-dev/viem/blob/e0149711da5894ac5f0719414b4ecc06ccaecb7b/src/chains/celo/serializers.ts#L164-L168
        ...(feeCurrencyAddress && { feeCurrency: feeCurrencyAddress }),
        // We assume the provided gas value is with the native fee currency
        // If it's not, we add the static padding
        gas: baseTx.gas + BigInt(feeCurrency.isNative ? 0 : STATIC_GAS_PADDING),
      })
    }
  }

  return transactions
}

async function tryEstimateTransaction(
  baseTransaction: TransactionRequestCIP42,
  feeCurrency: TokenBalance,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint | undefined
) {
  const feeCurrencyAddress = getFeeCurrencyAddress(feeCurrency)
  const tx = {
    ...baseTransaction,
    maxFeePerGas,
    maxPriorityFeePerGas,
    // Don't include the feeCurrency field if not present.
    // See https://github.com/wagmi-dev/viem/blob/e0149711da5894ac5f0719414b4ecc06ccaecb7b/src/chains/celo/serializers.ts#L164-L168
    ...(feeCurrencyAddress && { feeCurrency: feeCurrencyAddress }),
  }

  // TODO maybe cache this? and add static padding when using non-native fee currency
  try {
    tx.gas = await publicClient.celo.estimateGas({
      ...tx,
      account: tx.from,
    })
  } catch (e) {
    if (e instanceof EstimateGasExecutionError) {
      // Likely too much gas was needed
      Logger.warn(
        'SwapScreen@useSwapQuote',
        `Couldn't estimate gas with feeCurrency ${feeCurrency.symbol} (${feeCurrency.tokenId}), trying next feeCurrency`,
        e
      )
      return null
    }
    throw e
  }

  return tx
}

export function getMaxGasCost(txs: TransactionRequestCIP42[]) {
  let maxGasCost = BigInt(0)
  for (const tx of txs) {
    if (!tx.gas || !tx.maxFeePerGas) {
      throw new Error('Missing gas or maxFeePerGas')
    }
    maxGasCost += BigInt(tx.gas) * BigInt(tx.maxFeePerGas)
  }
  return maxGasCost
}

async function prepareTransactions(
  fromToken: TokenBalanceWithAddress,
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction,
  price: string,
  feeCurrencies: TokenBalance[]
): Promise<PreparedTransactionsResult> {
  const { amountToApprove, baseTransactions } = createBaseTransactions(
    fromToken,
    updatedField,
    unvalidatedSwapTransaction
  )

  const maxGasCosts: Array<{ feeCurrency: TokenBalance; maxGasCostInDecimal: BigNumber }> = []
  for (const feeCurrency of feeCurrencies) {
    if (feeCurrency.balance.isLessThanOrEqualTo(0)) {
      // No balance, try next fee currency
      continue
    }

    const estimatedTransactions = await tryEstimateTransactions(baseTransactions, feeCurrency)
    if (!estimatedTransactions) {
      // Not enough balance to pay for gas, try next fee currency
      continue
    }

    const maxGasCost = getMaxGasCost(estimatedTransactions)
    const maxGasCostInDecimal = new BigNumber(maxGasCost.toString()).shiftedBy(
      -feeCurrency.decimals
    )
    maxGasCosts.push({ feeCurrency, maxGasCostInDecimal })
    if (maxGasCostInDecimal.isGreaterThan(feeCurrency.balance)) {
      // Not enough balance to pay for gas, try next fee currency
      continue
    }

    const fromAmount = new BigNumber(amountToApprove.toString()).shiftedBy(-fromToken.decimals)
    if (
      fromToken.tokenId === feeCurrency.tokenId &&
      fromAmount.plus(maxGasCostInDecimal).isGreaterThan(fromToken.balance)
    ) {
      // Not enough balance to pay for gas, try next fee currency
      continue
    }

    // This is the one we can use
    return {
      type: 'possible',
      transactions: estimatedTransactions,
    } satisfies PreparedTransactionsPossible
  }

  // So far not enough balance to pay for gas
  // let's see if we can decrease the swap from amount
  const result = maxGasCosts.find(({ feeCurrency }) => feeCurrency.tokenId === fromToken.tokenId)
  if (!result || result.maxGasCostInDecimal.isGreaterThan(result.feeCurrency.balance)) {
    // Can't decrease the swap from amount
    return {
      type: 'not-enough-balance-for-gas',
      feeCurrencies,
    } satisfies PreparedTransactionsNotEnoughBalanceForGas
  }

  // We can decrease the swap from amount to pay for gas,
  // We'll ask the user if they want to proceed
  const adjustedMaxGasCost = result.maxGasCostInDecimal.times(
    DECREASED_SWAP_AMOUNT_GAS_COST_MULTIPLIER
  )
  const maxFromAmount = fromToken.balance.minus(adjustedMaxGasCost)
  const maxToAmount = maxFromAmount.times(price)

  return {
    type: 'need-decrease-swap-amount-for-gas',
    maxGasCost: adjustedMaxGasCost,
    feeCurrency: result.feeCurrency,
    decreasedSwapAmount: updatedField === Field.FROM ? maxFromAmount : maxToAmount,
  } satisfies PreparedTransactionsNeedDecreaseSwapAmountForGas
}

const useSwapQuote = () => {
  const walletAddress = useSelector(walletAddressSelector)
  const useGuaranteedPrice = useSelector(guaranteedSwapPriceEnabledSelector)
  const [exchangeRate, setExchangeRate] = useState<QuoteResult | null>(null)

  // TODO use the networkId from the fromToken
  const feeCurrencies = useFeeCurrencies(networkConfig.defaultNetworkId)

  // refreshQuote requests are generated when the swap input amounts are
  // changed, but the quote response / updated exchange rate updates the swap
  // input amounts. this variable prevents duplicated requests in this scenario
  const requestUrlRef = useRef<string>('')

  const refreshQuote = useAsyncCallback(
    async (
      fromToken: TokenBalanceWithAddress,
      toToken: TokenBalanceWithAddress,
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
        buyToken: toToken.address,
        sellToken: fromToken.address,
        [swapAmountParam]: swapAmountInWei.toFixed(0, BigNumber.ROUND_DOWN),
        userAddress: walletAddress ?? '',
      }
      const queryParams = new URLSearchParams({ ...params }).toString()
      const requestUrl = `${networkConfig.approveSwapUrl}?${queryParams}`
      if (requestUrl === requestUrlRef.current) {
        // return the current exchange rate if the request url hasn't changed
        return exchangeRate
      }

      requestUrlRef.current = requestUrl
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
        toTokenAddress: toToken.address,
        fromTokenAddress: fromToken.address,
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
        const preparedTransactions = await prepareTransactions(
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
    requestUrlRef.current = ''
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
