import BigNumber from 'bignumber.js'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { TokenBalance } from 'src/tokens/slice'
import { multiplyByWei } from 'src/utils/formatting'
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

  const refreshQuote = async (
    fromToken: TokenBalance,
    toToken: TokenBalance,
    swapAmount: SwapAmount,
    updatedField: Field
  ) => {
    if (!swapAmount[updatedField]) {
      setExchangeRate(null)
      return
    }

    const swapAmountParam = updatedField === Field.FROM ? 'sellAmount' : 'buyAmount'
    const quoteResponse = await fetch(
      `${networkConfig.approveSwapUrl}?buyToken=${toToken.address}&sellToken=${
        fromToken.address
      }&${swapAmountParam}=${multiplyByWei(
        swapAmount[updatedField]!
      ).toString()}&userAddress=${walletAddress}`
    )
    const quote = await quoteResponse.json()
    const swapPrice = quote.unvalidatedSwapTransaction.price
    setExchangeRate(
      updatedField === Field.FROM
        ? swapPrice
        : new BigNumber(1).div(new BigNumber(swapPrice)).toString()
    )
  }

  return {
    exchangeRate,
    refreshQuote,
  }
}

export default useSwapQuote
