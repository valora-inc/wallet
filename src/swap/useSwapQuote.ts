import BigNumber from 'bignumber.js'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { SwapCache } from 'src/swap/SwapCache'
import { TokenBalance } from 'src/tokens/slice'
import { multiplyByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

/**
 * NOTE: It looks like the 0x integration is wrapped by Valora's cloud functions, so this code should serve more as
 * a tutorial on integrating with Minima rather than the actual integration.  I imagine if Minima is integrated then
 * a similar process will be desired as is currently being used for 0x
 *
 * See a production use of minima at https://mobius.money
 */

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
  const [fetchingSwapQuote, setFetchingSwapQuote] = useState(false)

  useEffect(() => {
    setFetchingSwapQuote(false)
  }, [exchangeRate])

  const refreshQuote = async (
    fromToken: TokenBalance,
    toToken: TokenBalance,
    swapAmount: SwapAmount,
    updatedField: Field,
    maxHops = 4,
    slippageBips = 50,
    includePriceImpact = true
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

    try {
      setFetchingSwapQuote(true)

      const params = {
        tokenIn: toToken.address,
        tokenOut: fromToken.address,
        amountInWei: swapAmountInWei.toFixed(0),
        from: walletAddress ?? undefined,
        maxHops,
        slippageBips,
        includePriceImpact,
      }
      const quoteResponse = await SwapCache.get.fetch(params)

      if (quoteResponse.ok && quoteResponse.json) {
        const {
          expectedOut,
          details: { inputAmount },
        } = quoteResponse.json

        const swapPrice = new BigNumber(inputAmount).div(new BigNumber(expectedOut)).toString()
        setExchangeRate(
          updatedField === Field.FROM
            ? swapPrice
            : new BigNumber(1).div(new BigNumber(swapPrice)).toString()
        )
      } else {
        setFetchSwapQuoteError(true)
        setExchangeRate(null)
        Logger.warn('SwapScreen@useSwapQuote', 'error from approve swap url', quoteResponse.message)
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
    fetchingSwapQuote,
  }
}

export default useSwapQuote
