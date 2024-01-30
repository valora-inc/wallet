import BigNumber from 'bignumber.js'
import { TokenProperties } from 'src/analytics/Properties'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { CurrencyTokens } from 'src/tokens/selectors'
import { Network, NetworkId } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { ONE_DAY_IN_MILLIS, ONE_HOUR_IN_MILLIS } from 'src/utils/time'
import networkConfig from 'src/web3/networkConfig'
import { TokenBalance } from './slice'

export function getHigherBalanceCurrency(
  currencies: Currency[],
  tokens: CurrencyTokens
): Currency | undefined {
  let maxCurrency: Currency | undefined
  let maxUsdBalance: BigNumber | null = null
  for (const currency of currencies) {
    const usdBalance = tokens[currency]?.balance.multipliedBy(tokens[currency]?.priceUsd ?? 0)
    if (usdBalance?.gt(maxUsdBalance ?? 0)) {
      maxCurrency = currency
      maxUsdBalance = usdBalance
    }
  }
  return maxCurrency
}

export function sortByUsdBalance(token1: TokenBalance, token2: TokenBalance) {
  const token1UsdBalance = token1.balance.multipliedBy(token1.priceUsd ?? 0)
  const token2UsdBalance = token2.balance.multipliedBy(token2.priceUsd ?? 0)
  return token2UsdBalance.comparedTo(token1UsdBalance)
}

export function tokenSupportsComments(token: TokenBalance | undefined) {
  return (
    token?.canTransferWithComment &&
    token.symbol !== 'CELO' &&
    token.networkId === networkConfig.networkToNetworkId[Network.Celo]
  )
}

/**
 * It sorts in 3 categories:
 * Stable tokens: (cUSD, cEUR, cREAL) (sorted by usd balance)
 * CELO
 * Other tokens: sorted by usd balance
 *
 * If someone comes with a better name for this, I would appreciate it.
 */
export function sortFirstStableThenCeloThenOthersByUsdBalance(
  token1: TokenBalance,
  token2: TokenBalance
): number {
  // Show fee currency tokens first
  if (token1.isFeeCurrency && !token2.isFeeCurrency) {
    return -1
  }
  if (!token1.isFeeCurrency && token2.isFeeCurrency) {
    return 1
  }

  // Show stable tokens first
  if (token1.isFeeCurrency && token2.isFeeCurrency) {
    if (token1.symbol === 'CELO' && token2.symbol !== 'CELO') {
      return 1
    }
    if (token1.symbol !== 'CELO' && token2.symbol === 'CELO') {
      return -1
    }
  }

  // Show non-native tokens without usd price in the bottom of the list.
  // And show stable tokens without usd price at the bottom of their category.
  if (!token1.priceUsd && !token2.priceUsd) {
    return token2.balance.comparedTo(token1.balance)
  }

  if (!token1.priceUsd) {
    return 1
  }
  if (!token2.priceUsd) {
    return -1
  }

  // In each category sort by usd Balance
  return usdBalance(token2).comparedTo(usdBalance(token1))
}

/**
 *
 * Sorts by:
 * 1. cicoOrder value, smallest first
 *  1.1. If both tokens have cicoOrder value, sort by sortFirstStableThenCeloThenOthersByUsdBalance
 * 2. If only one token has cicoOrder value, it goes first
 * 3. If neither token has cicoOrder value, sort by sortFirstStableThenCeloThenOthersByUsdBalance
 */
export function sortCicoTokens(token1: TokenBalance, token2: TokenBalance): number {
  const cicoTokenInfo = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.CICO_TOKEN_INFO]
  ).tokenInfo
  if (
    (!cicoTokenInfo[token1.tokenId]?.cicoOrder && !cicoTokenInfo[token2.tokenId]?.cicoOrder) ||
    cicoTokenInfo[token1.tokenId]?.cicoOrder === cicoTokenInfo[token2.tokenId]?.cicoOrder
  ) {
    return sortFirstStableThenCeloThenOthersByUsdBalance(token1, token2)
  }
  if (!cicoTokenInfo[token1.tokenId]?.cicoOrder) {
    return 1
  }
  if (!cicoTokenInfo[token2.tokenId]?.cicoOrder) {
    return -1
  }
  return cicoTokenInfo[token1.tokenId]?.cicoOrder < cicoTokenInfo[token2.tokenId]?.cicoOrder
    ? -1
    : 1
}

export function usdBalance(token: TokenBalance): BigNumber {
  return token.balance.times(token.priceUsd ?? 0)
}

export function convertLocalToTokenAmount({
  localAmount,
  tokenInfo,
  usdToLocalRate,
}: {
  localAmount: BigNumber | null
  tokenInfo: TokenBalance | undefined
  usdToLocalRate: string | null
}) {
  const tokenPriceUsd = tokenInfo?.priceUsd
  if (!tokenPriceUsd || !usdToLocalRate || !localAmount) {
    return null
  }

  return localAmount.dividedBy(usdToLocalRate).dividedBy(tokenPriceUsd)
}

export function convertTokenToLocalAmount({
  tokenAmount,
  tokenInfo,
  usdToLocalRate,
}: {
  tokenAmount: BigNumber | null
  tokenInfo: TokenBalance | undefined
  usdToLocalRate: string | null
}) {
  const tokenPriceUsd = tokenInfo?.priceUsd
  if (!tokenPriceUsd || !usdToLocalRate || !tokenAmount) {
    return null
  }

  return tokenAmount.multipliedBy(tokenPriceUsd).multipliedBy(usdToLocalRate)
}

export function getSupportedNetworkIdsForTokenBalances(): NetworkId[] {
  return getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES])
    .showBalances
}

export function getTokenId(networkId: NetworkId, tokenAddress?: string): string {
  if (
    (networkId === networkConfig.networkToNetworkId[Network.Celo] &&
      tokenAddress === networkConfig.celoTokenAddress) ||
    !tokenAddress
  ) {
    return `${networkId}:native`
  }
  return `${networkId}:${tokenAddress}`
}

export function getSupportedNetworkIdsForSend(): NetworkId[] {
  return getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]).showSend
}

export function getSupportedNetworkIdsForSwap(): NetworkId[] {
  return getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]).showSwap
}

export function getSupportedNetworkIdsForWalletConnect(): NetworkId[] {
  return getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES])
    .showWalletConnect
}

export function getSupportedNetworkIdsForApprovalTxsInHomefeed(): NetworkId[] {
  return getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES])
    .showApprovalTxsInHomefeed
}

export function getTokenAnalyticsProps(token: TokenBalance): TokenProperties {
  return {
    symbol: token.symbol,
    address: token.address,
    balanceUsd: token.balance.multipliedBy(token.priceUsd ?? 0).toNumber(),
    networkId: token.networkId,
    tokenId: token.tokenId,
  }
}

/**
 * Checks whether the historical price is updated and is one day old +/- 1 hour.
 * Used for showing / hiding the price delta on legacy Assets and TokenDetails
 * pages
 *
 * @param {TokenBalance} token
 * @returns {boolean}
 */
export function isHistoricalPriceUpdated(token: TokenBalance) {
  return (
    !!token.historicalPricesUsd?.lastDay &&
    ONE_HOUR_IN_MILLIS >
      Math.abs(token.historicalPricesUsd.lastDay.at - (Date.now() - ONE_DAY_IN_MILLIS))
  )
}
