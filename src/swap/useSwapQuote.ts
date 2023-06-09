import BigNumber from 'bignumber.js'
import { useRef, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useSelector } from 'react-redux'
import { guaranteedSwapPriceEnabledSelector } from 'src/swap/selectors'
import { FetchQuoteResponse, Field, ParsedSwapAmount } from 'src/swap/types'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

interface ExchangeRate {
  toTokenAddress: string
  fromTokenAddress: string
  swapAmount: BigNumber
  price: string
  provider: string
}

const useSwapQuote = () => {
  const walletAddress = useSelector(walletAddressSelector)
  const useGuaranteedPrice = useSelector(guaranteedSwapPriceEnabledSelector)
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)

  // refreshQuote requests are generated when the swap input amounts are
  // changed, but the quote response / updated exchange rate updates the swap
  // input amounts. this variable prevents duplicated requests in this scenario
  const requestUrlRef = useRef<string>('')

  const refreshQuote = useAsyncCallback(
    async (
      fromToken: TokenBalance,
      toToken: TokenBalance,
      swapAmount: ParsedSwapAmount,
      updatedField: Field
    ) => {
      if (!swapAmount[updatedField].gt(0)) {
        return null
      }

      // This only works for tokens with 18 decimals
      // TODO: make this work for tokens with different decimals
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
      const updatedExchangeRate: ExchangeRate = {
        toTokenAddress: toToken.address,
        fromTokenAddress: fromToken.address,
        swapAmount: swapAmount[updatedField],
        price:
          updatedField === Field.FROM
            ? swapPrice
            : new BigNumber(1).div(new BigNumber(swapPrice)).toFixed(),
        provider: quote.details.swapProvider,
      }

      return updatedExchangeRate
    },
    {
      onSuccess: (updatedExchangeRate: ExchangeRate | null) => {
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
