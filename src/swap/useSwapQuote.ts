import BigNumber from 'bignumber.js'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import { useRef, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useSelector } from 'react-redux'
import erc20 from 'src/abis/IERC20'
import { useFeeCurrencies } from 'src/fees/hooks'
import { guaranteedSwapPriceEnabledSelector } from 'src/swap/selectors'
import { FetchQuoteResponse, Field, ParsedSwapAmount, SwapTransaction } from 'src/swap/types'
import { TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { getGasPrice } from 'src/web3/gas'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address, Hex, encodeFunctionData } from 'viem'

interface BaseQuoteResult {
  toTokenAddress: string
  fromTokenAddress: string
  swapAmount: BigNumber
  price: string
  provider: string
  estimatedPriceImpact: BigNumber | null
}

interface QuoteResultPossible extends BaseQuoteResult {
  type: 'possible'
  approveTransaction: TransactionRequestCIP42 & { amountToApprove: bigint }
  swapTransaction: TransactionRequestCIP42
}

export interface QuoteResultNeedDecreaseSwapAmountForGas extends BaseQuoteResult {
  type: 'need-decrease-swap-amount-for-gas'
  maxGasCost: BigNumber
  feeCurrency: TokenBalance
}

export interface QuoteResultNotEnoughBalanceForGas extends BaseQuoteResult {
  type: 'not-enough-balance-for-gas'
  feeCurrencies: TokenBalance[]
}

export type QuoteResult =
  | QuoteResultPossible
  | QuoteResultNeedDecreaseSwapAmountForGas
  | QuoteResultNotEnoughBalanceForGas

function createApproveTransaction(
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction
) {
  const { guaranteedPrice, sellTokenAddress, buyAmount, sellAmount, allowanceTarget, from } =
    unvalidatedSwapTransaction
  const amountType: string =
    updatedField === Field.TO ? ('buyAmount' as const) : ('sellAmount' as const)

  const amountToApprove =
    amountType === 'buyAmount' ? BigInt(buyAmount) * BigInt(guaranteedPrice) : BigInt(sellAmount)

  const data = encodeFunctionData({
    abi: erc20.abi,
    functionName: 'approve',
    args: [allowanceTarget as Address, amountToApprove],
  })

  const approveTx: TransactionRequestCIP42 & { amountToApprove: bigint } = {
    from: from as Address,
    to: sellTokenAddress as Address,
    data,
    type: 'cip42',
    amountToApprove,
  }

  return approveTx
}

function createSwapTransaction(unvalidatedSwapTransaction: SwapTransaction) {
  const { from, to, value, data, gas } = unvalidatedSwapTransaction

  const swapTx: TransactionRequestCIP42 = {
    from: from as Address,
    to: to as Address,
    value: BigInt(value ? value : 0),
    data: data as Hex,
    gas: BigInt(gas), // This isn't entirely accurate
    type: 'cip42',
  }

  return swapTx
}

function getMaxGasCost(txs: TransactionRequestCIP42[]) {
  let maxGasCost = BigInt(0)
  for (const tx of txs) {
    if (!tx.gas || !tx.maxFeePerGas) {
      throw new Error('Missing gas or maxFeePerGas')
    }
    maxGasCost += BigInt(tx.gas) * BigInt(tx.maxFeePerGas)
  }
  return maxGasCost
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
      updatedField: Field
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
      const estimatedPriceImpact = quote.unvalidatedSwapTransaction.estimatedPriceImpact
      const baseQuoteResult: BaseQuoteResult = {
        toTokenAddress: toToken.address,
        fromTokenAddress: fromToken.address,
        swapAmount: swapAmount[updatedField],
        price:
          updatedField === Field.FROM
            ? swapPrice
            : new BigNumber(1).div(new BigNumber(swapPrice)).toFixed(),
        provider: quote.details.swapProvider,
        estimatedPriceImpact: estimatedPriceImpact
          ? new BigNumber(estimatedPriceImpact).dividedBy(100)
          : null,
      }

      const baseApproveTx = createApproveTransaction(updatedField, quote.unvalidatedSwapTransaction)
      const baseSwapTx = createSwapTransaction(quote.unvalidatedSwapTransaction)

      let maxGasCosts: Array<[TokenBalance, BigNumber]> = []
      for (const feeCurrency of feeCurrencies) {
        // TODO: this is Celo specific, make it generic
        const gasPrice = BigInt((await getGasPrice(feeCurrency.address ?? undefined)).toFixed())

        const approveTx = {
          ...baseApproveTx,
          maxFeePerGas: gasPrice,
          feeCurrency: !feeCurrency.isNative ? (feeCurrency.address as Address) : undefined,
          // We could estimate this ourselves,
          // but for now we'll just use the value from the quote
          gas: BigInt(quote.approveTransaction.gas),
        }

        const swapTx = {
          ...baseSwapTx,
          maxFeePerGas: gasPrice,
          feeCurrency: !feeCurrency.isNative ? (feeCurrency.address as Address) : undefined,
        }

        const maxGasCost = getMaxGasCost([approveTx, swapTx])
        const maxGasCostInDecimal = new BigNumber(maxGasCost.toString()).shiftedBy(
          -feeCurrency.decimals
        )
        maxGasCosts.push([feeCurrency, maxGasCostInDecimal])
        if (maxGasCostInDecimal.gt(feeCurrency.balance)) {
          // Not enough balance to pay for gas, try next fee currency
          continue
        }

        const fromAmount = new BigNumber(approveTx.amountToApprove.toString()).shiftedBy(
          -fromToken.decimals
        )
        if (
          fromToken.tokenId === feeCurrency.tokenId &&
          fromAmount.plus(maxGasCostInDecimal).gt(fromToken.balance)
        ) {
          // Not enough balance to pay for gas, try next fee currency
          continue
        }

        // This is the one we can use
        return {
          ...baseQuoteResult,
          type: 'possible',
          approveTransaction: approveTx,
          swapTransaction: swapTx,
        } satisfies QuoteResultPossible
      }

      // So far not enough balance to pay for gas
      // let's see if we can decrease the swap from amount
      const result = maxGasCosts.find(([feeCurrency]) => feeCurrency.tokenId === fromToken.tokenId)
      if (!result || result[1].gt(result[0].balance)) {
        // Can't decrease the swap from amount
        return {
          ...baseQuoteResult,
          type: 'not-enough-balance-for-gas',
          feeCurrencies,
        } satisfies QuoteResultNotEnoughBalanceForGas
      }

      // We can decrease the swap from amount to pay for gas,
      // We'll ask the user if they want to proceed
      return {
        ...baseQuoteResult,
        type: 'need-decrease-swap-amount-for-gas',
        maxGasCost: result[1],
        feeCurrency: result[0],
      } satisfies QuoteResultNeedDecreaseSwapAmountForGas
    },
    {
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
