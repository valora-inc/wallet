import BigNumber from 'bignumber.js'
import { TIME_UNTIL_TOKEN_INFO_BECOMES_STALE, TOKEN_MIN_AMOUNT } from 'src/config'
import { usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import {
  tokensByAddressSelector,
  tokensByCurrencySelector,
  tokensByIdSelectorWrapper,
  tokensListSelectorWrapper,
  tokensListWithAddressSelector,
  tokensWithUsdValueSelectorWrapper,
  totalTokenBalanceSelectorWrapper,
} from 'src/tokens/selectors'
import {
  convertLocalToTokenAmount,
  convertTokenToLocalAmount,
  getSupportedNetworkIdsForTokenBalances,
} from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'
/**
 * @deprecated use useTokenInfo and select using tokenId
 */
export function useTokenInfoByAddress(tokenAddress?: string | null) {
  const tokens = useSelector(tokensByAddressSelector)
  return tokenAddress ? tokens[tokenAddress] : undefined
}

export function useTokensWithUsdValue(networkIds: NetworkId[]) {
  return useSelector(tokensWithUsdValueSelectorWrapper(networkIds))
}

export function useTotalTokenBalance() {
  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
  return useSelector(totalTokenBalanceSelectorWrapper(supportedNetworkIds))
}

export function useTokensWithTokenBalance() {
  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
  const tokens = useSelector(tokensListSelectorWrapper(supportedNetworkIds))
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
 * @deprecated only used in the old CICO send bar and should be removed when that is updated to multi-chain support
 */
export function useTokenInfoBySymbol(symbol: string) {
  const networkIds = Object.values(networkConfig.networkToNetworkId)
  const tokens = useSelector(tokensListSelectorWrapper(networkIds))
  return tokens.find((tokenInfo) => tokenInfo.symbol === symbol)
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

export function useLocalToTokenAmount(localAmount: BigNumber, tokenId: string): BigNumber | null {
  const tokenInfo = useTokenInfo(tokenId)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  return convertLocalToTokenAmount({
    localAmount,
    tokenInfo,
    usdToLocalRate,
  })
}

/**
 * @deprecated use useLocalToTokenAmount
 */
export function useLocalToTokenAmountByAddress(
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

export function useTokenToLocalAmount(tokenAmount: BigNumber, tokenId: string): BigNumber | null {
  const tokenInfo = useTokenInfo(tokenId)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  return convertTokenToLocalAmount({
    tokenAmount,
    tokenInfo,
    usdToLocalRate,
  })
}

/**
 * @deprecated use useLocalToTokenAmount
 */
export function useTokenToLocalAmountByAddress(
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

export function useAmountAsUsd(amount: BigNumber, tokenId: string) {
  const tokenInfo = useTokenInfo(tokenId)
  if (!tokenInfo?.priceUsd) {
    return null
  }
  return amount.multipliedBy(tokenInfo.priceUsd)
}

/**
 * @deprecated use useAmountAsUsd
 */
export function useAmountAsUsdByAddress(amount: BigNumber, tokenAddress: string) {
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
