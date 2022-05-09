import BigNumber from 'bignumber.js'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { tokensByAddressSelector, tokensListSelector } from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'

export function useTokenInfo(tokenAddress: string) {
  const tokens = useSelector(tokensByAddressSelector)
  return tokens[tokenAddress]
}

export function useTokenInfoBySymbol(symbol: string) {
  const tokens = useSelector(tokensListSelector)
  return tokens.find((tokenInfo) => tokenInfo.symbol === symbol)
}

export function useLocalToTokenAmount(
  localAmount: BigNumber,
  tokenAddress: string
): BigNumber | null {
  const tokenInfo = useTokenInfo(tokenAddress)
  const tokenUsdPrice = tokenInfo?.usdPrice
  const usdExchangeRate = useSelector(localCurrencyExchangeRatesSelector)[Currency.Dollar]
  if (!tokenUsdPrice || !usdExchangeRate) {
    return null
  }

  return localAmount.dividedBy(usdExchangeRate).dividedBy(tokenUsdPrice)
}

export function useTokenToLocalAmount(
  tokenAmount: BigNumber,
  tokenAddress: string
): BigNumber | null {
  const tokenInfo = useTokenInfo(tokenAddress)
  const tokenUsdPrice = tokenInfo?.usdPrice
  const usdExchangeRate = useSelector(localCurrencyExchangeRatesSelector)[Currency.Dollar]
  if (!tokenUsdPrice || !usdExchangeRate) {
    return null
  }

  return tokenAmount.multipliedBy(tokenUsdPrice).multipliedBy(usdExchangeRate)
}

export function useAmountAsUsd(amount: BigNumber, tokenAddress: string) {
  const tokenInfo = useTokenInfo(tokenAddress)
  if (!tokenInfo?.usdPrice) {
    return null
  }
  return amount.multipliedBy(tokenInfo.usdPrice)
}

export function useUsdToTokenAmount(amount: BigNumber, tokenAddress: string) {
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
