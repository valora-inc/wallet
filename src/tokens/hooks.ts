import BigNumber from 'bignumber.js'
import { TIME_UNTIL_TOKEN_INFO_BECOMES_STALE } from 'src/config'
import { usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import {
  cashInTokensByNetworkIdSelector,
  cashOutTokensByNetworkIdSelector,
  sortedTokensWithBalanceSelector,
  spendTokensByNetworkIdSelector,
  swappableFromTokensByNetworkIdSelector,
  swappableToTokensByNetworkIdSelector,
  tokensByAddressSelector,
  tokensByCurrencySelector,
  tokensByIdSelector,
  tokensListSelector,
  tokensListWithAddressSelector,
  tokensWithTokenBalanceSelector,
  tokensWithUsdValueSelector,
  totalTokenBalanceSelector,
} from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import {
  convertLocalToTokenAmount,
  convertTokenToLocalAmount,
  getSupportedNetworkIdsForSend,
  getSupportedNetworkIdsForTokenBalances,
} from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { deterministicShuffle } from 'src/utils/random'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

/**
 * @deprecated use useTokenInfo and select using tokenId
 */
export function useTokenInfoByAddress(tokenAddress?: string | null) {
  const tokens = useSelector(tokensByAddressSelector)
  return tokenAddress ? tokens[tokenAddress] : undefined
}

export function useTokensWithUsdValue(networkIds: NetworkId[]) {
  return useSelector((state) => tokensWithUsdValueSelector(state, networkIds))
}

export function useTotalTokenBalance() {
  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
  return useSelector((state) => totalTokenBalanceSelector(state, supportedNetworkIds))
}

export function useTokensWithTokenBalance() {
  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
  return useSelector((state) => tokensWithTokenBalanceSelector(state, supportedNetworkIds))
}

export function useTokensForSend() {
  const supportedNetworkIds = getSupportedNetworkIdsForSend()
  return useSelector((state) => sortedTokensWithBalanceSelector(state, supportedNetworkIds))
}

export function useTokensInfoUnavailable(networkIds: NetworkId[]) {
  const totalBalance = useSelector((state) => totalTokenBalanceSelector(state, networkIds))
  return totalBalance === null
}

export function useTokensList() {
  const networkIds = Object.values(networkConfig.networkToNetworkId)
  return useSelector((state) => tokensListSelector(state, networkIds))
}

export function useTokenPricesAreStale(networkIds: NetworkId[]) {
  const tokens = useSelector((state) => tokensListSelector(state, networkIds))
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

export function useSwappableTokens() {
  const networkIdsForSwap = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
  ).showSwap
  const shouldShuffleTokens = getFeatureGate(StatsigFeatureGates.SHUFFLE_SWAP_TOKENS_ORDER)

  const walletAddress = useSelector(walletAddressSelector)
  const swappableFromTokens = useSelector((state) =>
    swappableFromTokensByNetworkIdSelector(state, networkIdsForSwap)
  )
  const swappableToTokens = useSelector((state) =>
    swappableToTokensByNetworkIdSelector(state, networkIdsForSwap)
  )

  if (shouldShuffleTokens && walletAddress) {
    return {
      swappableFromTokens: deterministicShuffle(swappableFromTokens, 'tokenId', walletAddress),
      swappableToTokens: deterministicShuffle(swappableToTokens, 'tokenId', walletAddress),
      areSwapTokensShuffled: true,
    }
  }

  return {
    swappableFromTokens,
    swappableToTokens,
    areSwapTokensShuffled: false,
  }
}

export function useCashInTokens() {
  const networkIdsForCico = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
  ).showCico
  return useSelector((state) => cashInTokensByNetworkIdSelector(state, networkIdsForCico))
}

export function useCashOutTokens(showZeroBalanceTokens: boolean = false) {
  const networkIdsForCico = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
  ).showCico
  return useSelector((state) =>
    cashOutTokensByNetworkIdSelector(state, networkIdsForCico, showZeroBalanceTokens)
  )
}

export function useSpendTokens() {
  const networkIdsForCico = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
  ).showCico
  return useSelector((state) => spendTokensByNetworkIdSelector(state, networkIdsForCico))
}

export function useTokenInfo(tokenId?: string): TokenBalance | undefined {
  const networkIds = Object.values(networkConfig.networkToNetworkId)
  const tokens = useSelector((state) => tokensByIdSelector(state, networkIds))
  return tokenId ? tokens[tokenId] : undefined
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
  tokenId: string | undefined
): BigNumber | null {
  const tokenInfo = useTokenInfo(tokenId)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  return convertLocalToTokenAmount({
    localAmount,
    tokenInfo,
    usdToLocalRate,
  })
}

export function useTokenToLocalAmount(
  tokenAmount: BigNumber,
  tokenId: string | undefined
): BigNumber | null {
  const tokenInfo = useTokenInfo(tokenId)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  return convertTokenToLocalAmount({
    tokenAmount,
    tokenInfo,
    usdToLocalRate,
  })
}

export function useAmountAsUsd(amount: BigNumber, tokenId: string | undefined) {
  const tokenInfo = useTokenInfo(tokenId)
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
