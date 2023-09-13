import BigNumber from 'bignumber.js'
import { usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import {
  tokensByAddressSelector,
  tokensByCurrencySelector,
  tokensListSelector,
} from 'src/tokens/selectors'
import { convertLocalToTokenAmount, convertTokenToLocalAmount } from 'src/tokens/utils'
import { Currency } from 'src/utils/currencies'

export function useTokenInfo(tokenAddress?: string | null) {
  // TODO: Make this work with native tokens lacking a tokenAddress
  const tokens = useSelector(tokensByAddressSelector)
  return tokenAddress ? tokens[tokenAddress] : undefined
}

export function useTokenInfoBySymbol(symbol: string) {
  const tokens = useSelector(tokensListSelector)
  return tokens.find((tokenInfo) => tokenInfo.symbol === symbol)
}

export function useTokenInfoByCurrency(currency: Currency) {
  const tokens = useSelector(tokensByCurrencySelector)
  return tokens[currency]
}

export function useLocalToTokenAmount(
  localAmount: BigNumber,
  tokenAddress?: string
): BigNumber | null {
  const tokenInfo = useTokenInfo(tokenAddress)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  return convertLocalToTokenAmount({
    localAmount,
    tokenInfo,
    usdToLocalRate,
  })
}

export function useTokenToLocalAmount(
  tokenAmount: BigNumber,
  tokenAddress?: string
): BigNumber | null {
  const tokenInfo = useTokenInfo(tokenAddress)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  return convertTokenToLocalAmount({
    tokenAmount,
    tokenInfo,
    usdToLocalRate,
  })
}

export function useAmountAsUsd(amount: BigNumber, tokenAddress: string) {
  const tokenInfo = useTokenInfo(tokenAddress)
  if (!tokenInfo?.usdPrice) {
    return null
  }
  return amount.multipliedBy(tokenInfo.usdPrice)
}

export function useUsdToTokenAmount(amount: BigNumber, tokenAddress?: string) {
  const tokenInfo = useTokenInfo(tokenAddress)
  if (!tokenInfo?.usdPrice) {
    return null
  }
  return amount.div(tokenInfo.usdPrice)
}

export function useConvertBetweenTokens(
  amount: BigNumber | undefined,
  tokenAddress: string = '',
  newTokenAddress: string
) {
  const tokenBalances = useSelector(tokensByAddressSelector)

  const tokenUsdPrice = tokenBalances[tokenAddress ?? '']?.usdPrice
  const newTokenUsdPrice = tokenBalances[newTokenAddress]?.usdPrice
  if (!amount || !tokenUsdPrice || !newTokenUsdPrice) {
    return null
  }
  return amount.multipliedBy(tokenUsdPrice).dividedBy(newTokenUsdPrice)
}
