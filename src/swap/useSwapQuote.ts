import BigNumber from 'bignumber.js'
import { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { TokenBalance } from 'src/tokens/slice'
import { multiplyByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

export enum Field {
  FROM = 'FROM',
  TO = 'TO',
}

export type SwapAmount = {
  [Field.FROM]: null | string
  [Field.TO]: null | string
}

const useSwapQuote = () => {
  const walletAddress = useSelector(walletAddressSelector)
  const [exchangeRate, setExchangeRate] = useState<string | null>(null)
  const [fetchSwapQuoteError, setFetchSwapQuoteError] = useState(false)

  // refreshQuote requests are generated when the swap input amounts are
  // changed, but the quote response / updated exchange rate updates the swap
  // input amounts. this variable prevents duplicated requests in this scenario
  const requestUrlRef = useRef<string>('')

  const refreshQuote = async (
    fromToken: TokenBalance,
    toToken: TokenBalance,
    swapAmount: SwapAmount,
    updatedField: Field
  ) => {
    setFetchSwapQuoteError(false)

    if (!swapAmount[updatedField]) {
      setExchangeRate(null)
      return
    }

    const swapAmountInWei = multiplyByWei(swapAmount[updatedField]!)
    if (swapAmountInWei.lte(0)) {
      setExchangeRate(null)
      return
    }

    const swapAmountParam = updatedField === Field.FROM ? 'sellAmount' : 'buyAmount'
    const requestUrl = `${networkConfig.approveSwapUrl}?buyToken=${toToken.address}&sellToken=${
      fromToken.address
    }&${swapAmountParam}=${swapAmountInWei.toString().split('.')[0]}&userAddress=${walletAddress}`

    if (requestUrl === requestUrlRef.current) {
      // do nothing if the previous request url is the same as the current
      return
    }

    requestUrlRef.current = requestUrl

    try {
      const quoteResponse = await fetch(requestUrlRef.current)

      if (quoteResponse.ok) {
        const quote = await quoteResponse.json()
        const swapPrice = quote.unvalidatedSwapTransaction.price
        setExchangeRate(
          updatedField === Field.FROM
            ? swapPrice
            : new BigNumber(1).div(new BigNumber(swapPrice)).toString()
        )
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
  return {
    exchangeRate,
    refreshQuote,
    fetchSwapQuoteError,
  }
}

export default useSwapQuote
