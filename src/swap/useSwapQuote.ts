import BigNumber from 'bignumber.js'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { guaranteedSwapPriceEnabledSelector } from 'src/swap/selectors'
import { Field, ParsedSwapAmount } from 'src/swap/types'
import { TokenBalance } from 'src/tokens/slice'
import { multiplyByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

interface ExchangeRate {
  toTokenAddress: string
  fromTokenAddress: string
  price: string
}

const useSwapQuote = () => {
  const walletAddress = useSelector(walletAddressSelector)
  const useGuaranteedPrice = useSelector(guaranteedSwapPriceEnabledSelector)
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [fetchSwapQuoteError, setFetchSwapQuoteError] = useState(false)
  const [fetchingSwapQuote, setFetchingSwapQuote] = useState(false)

  useEffect(() => {
    setFetchingSwapQuote(false)
  }, [exchangeRate])

  // refreshQuote requests are generated when the swap input amounts are
  // changed, but the quote response / updated exchange rate updates the swap
  // input amounts. this variable prevents duplicated requests in this scenario
  const requestUrlRef = useRef<string>('')

  const refreshQuote = async (
    fromToken: TokenBalance,
    toToken: TokenBalance,
    swapAmount: ParsedSwapAmount,
    updatedField: Field
  ) => {
    setFetchSwapQuoteError(false)

    if (!swapAmount[updatedField].gt(0)) {
      setExchangeRate(null)
      return
    }

    // This only works for tokens with 18 decimals
    // TODO: make this work for tokens with different decimals
    const swapAmountInWei = multiplyByWei(swapAmount[updatedField])
    if (swapAmountInWei.lte(0)) {
      setExchangeRate(null)
      return
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
      // do nothing if the previous request url is the same as the current
      return
    }

    requestUrlRef.current = requestUrl

    try {
      setFetchingSwapQuote(true)
      const quoteResponse = await fetch(requestUrlRef.current)

      if (quoteResponse.ok) {
        const quote = await quoteResponse.json()
        const swapPrice = useGuaranteedPrice
          ? quote.unvalidatedSwapTransaction.guaranteedPrice
          : quote.unvalidatedSwapTransaction.price
        setExchangeRate({
          toTokenAddress: toToken.address,
          fromTokenAddress: fromToken.address,
          price:
            updatedField === Field.FROM
              ? swapPrice
              : new BigNumber(1).div(new BigNumber(swapPrice)).toFixed(),
        })
      } else {
        setFetchSwapQuoteError(true)
        setExchangeRate(null)
        Logger.warn(
          'SwapScreen@useSwapQuote',
          'error from approve swap url',
          await quoteResponse.text()
        )
      }
    } catch (error) {
      setFetchSwapQuoteError(true)
      setExchangeRate(null)
      Logger.warn('SwapScreen@useSwapQuote', 'error from approve swap url', error)
    }
  }

  const clearQuote = () => {
    requestUrlRef.current = ''
  }

  return {
    exchangeRate,
    refreshQuote,
    fetchSwapQuoteError,
    fetchingSwapQuote,
    clearQuote,
  }
}

export default useSwapQuote
