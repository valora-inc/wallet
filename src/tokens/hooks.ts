import BigNumber from 'bignumber.js'
import { usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import {
  tokensByAddressSelector,
  tokensByCurrencySelector,
  tokensByIdSelectorWrapper,
  tokensListSelectorWrapper,
  totalTokenBalanceSelectorWrapper,
  tokensWithUsdValueSelectorWrapper,
  tokensListWithAddressSelector,
} from 'src/tokens/selectors'
import { convertLocalToTokenAmount, convertTokenToLocalAmount } from 'src/tokens/utils'
import { Currency } from 'src/utils/currencies'
import { NetworkId } from 'src/transactions/types'
import { TIME_UNTIL_TOKEN_INFO_BECOMES_STALE, TOKEN_MIN_AMOUNT } from 'src/config'
import networkConfig from 'src/web3/networkConfig'

/**
 * @deprecated use useTokenInfo and select using tokenId
 */
export function useTokenInfoByAddress(tokenAddress?: string | null) {
  // TODO: Make this work with native tokens lacking a tokenAddress
  const tokens = useSelector(tokensByAddressSelector)
  return tokenAddress ? tokens[tokenAddress] : undefined
}

export function useTokensWithUsdValue(networkIds: NetworkId[]) {
  return useSelector(tokensWithUsdValueSelectorWrapper(networkIds))
}

export function useTotalTokenBalance(networkIds: NetworkId[]) {
  return useSelector(totalTokenBalanceSelectorWrapper(networkIds))
}

export function useTokensWithTokenBalance(networkIds: NetworkId[]) {
  const tokens = useSelector(tokensListSelectorWrapper(networkIds))
  return tokens.filter((tokenInfo) => tokenInfo.balance.gt(TOKEN_MIN_AMOUNT))
}

export function useTokensInfoUnavailable(networkIds: NetworkId[]) {
  const totalBalance = useSelector(totalTokenBalanceSelectorWrapper(networkIds))
  return totalBalance === null
}
export function useTokenPricesAreStale(networkIds: NetworkId[]) {
  const tokens = useSelector(tokensListSelectorWrapper(networkIds))
  // If no tokens then prices cannot be stale
  if (tokens.length === 0) return false
  // Put tokens with priceUsd into an array
  const tokensWithUsdValue = tokens.filter((tokenInfo) => tokenInfo.priceUsd !== null)
  // If tokens with usd value exist, check the time price was fetched and if ANY are stale - return true
  // Else tokens usd values are not present so we know prices are stale - return true
  if (tokensWithUsdValue.length > 0) {
    return tokensWithUsdValue.some(
      (tokenInfo) =>
        (tokenInfo.priceFetchedAt ?? 0) < Date.now() - TIME_UNTIL_TOKEN_INFO_BECOMES_STALE
    )
  } else {
    return true
  }
}

export function useTokenInfo(tokenId: string) {
  const networkIds = Object.values(networkConfig.networkToNetworkId)
  const tokens = useSelector(tokensByIdSelectorWrapper(networkIds))
  return tokens[tokenId]
}

/**
 * @deprecated
 */
export function useTokenInfoWithAddressBySymbol(symbol: string) {
  const tokens = useSelector(tokensListWithAddressSelector)
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
  const tokenInfo = useTokenInfoByAddress(tokenAddress)
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
  const tokenInfo = useTokenInfoByAddress(tokenAddress)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  return convertTokenToLocalAmount({
    tokenAmount,
    tokenInfo,
    usdToLocalRate,
  })
}

export function useAmountAsUsd(amount: BigNumber, tokenAddress: string) {
  const tokenInfo = useTokenInfoByAddress(tokenAddress)
  if (!tokenInfo?.priceUsd) {
    return null
  }
  return amount.multipliedBy(tokenInfo.priceUsd)
}

export function useUsdToTokenAmount(amount: BigNumber, tokenAddress?: string) {
  const tokenInfo = useTokenInfoByAddress(tokenAddress)
  if (!tokenInfo?.priceUsd) {
    return null
  }
  return amount.div(tokenInfo.priceUsd)
}

export function useConvertBetweenTokens(
  amount: BigNumber | undefined,
  tokenAddress: string = '',
  newTokenAddress: string
) {
  const tokenBalances = useSelector(tokensByAddressSelector)

  const tokenPriceUsd = tokenBalances[tokenAddress ?? '']?.priceUsd
  const newTokenPriceUsd = tokenBalances[newTokenAddress]?.priceUsd
  if (!amount || !tokenPriceUsd || !newTokenPriceUsd) {
    return null
  }
  return amount.multipliedBy(tokenPriceUsd).dividedBy(newTokenPriceUsd)
}
