import BigNumber from 'bignumber.js'
import _ from 'lodash'
import deviceInfoModule from 'react-native-device-info'
import { createSelector } from 'reselect'
import {
  STABLE_TRANSACTION_MIN_AMOUNT,
  TIME_UNTIL_TOKEN_INFO_BECOMES_STALE,
  TOKEN_MIN_AMOUNT,
} from 'src/config'
import { usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { Token } from 'src/positions/types'
import { RootState } from 'src/redux/reducers'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import {
  TokenBalance,
  TokenBalanceWithAddress,
  TokenBalances,
  TokenBalancesWithAddress,
} from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { isVersionBelowMinimum } from 'src/utils/versionCheck'
import networkConfig from 'src/web3/networkConfig'
import { isFeeCurrency, sortByUsdBalance, usdBalance } from './utils'

type TokenBalanceWithPriceUsd = TokenBalance & {
  priceUsd: BigNumber
}
export type CurrencyTokens = {
  [currency in Currency]: TokenBalanceWithAddress | undefined
}

// This is somewhat arbitrary, but appears to reliably prevent recalculation
// for selectors using networkId as a parameter
const DEFAULT_MEMOIZE_MAX_SIZE = 10

function isNetworkIdList(networkIds: any): networkIds is NetworkId[] {
  return (
    Array.isArray(networkIds) &&
    networkIds.every((networkId) => Object.values(NetworkId).includes(networkId))
  )
}
export const tokenFetchErrorSelector = (state: RootState) => state.tokens.error

// Note: not importing from 'src/positions/selectors' to avoid circular dependency
// TODO: address circular dependency
const positionsSelector = (state: RootState) => state.positions.positions
const positionsFetchedAtSelector = (state: RootState) => state.positions.positionsFetchedAt

const positionTokensSelector = createSelector([positionsSelector], (positions) => {
  const positionTokens: Record<string, Token> = {}

  function visitToken(token: Token, isTopLevelAppToken: boolean) {
    const tokenId = token.tokenId
    if (!positionTokens[tokenId] || isTopLevelAppToken) {
      positionTokens[tokenId] = {
        ...token,
        // Only keep the balance if it's a top level app-token
        // Otherwise it doesn't represent a real user balance
        balance: isTopLevelAppToken ? token.balance : '0',
      }
    }
    if (token.type === 'app-token') {
      for (const childToken of token.tokens) {
        visitToken(childToken, false)
      }
    }
  }

  for (const position of positions) {
    if (position.type === 'app-token') {
      visitToken(position, true)
    } else {
      for (const token of position.tokens) {
        visitToken(token, false)
      }
    }
  }
  return positionTokens
})

type TokensByIdArgs =
  | NetworkId[] // For backward compatibility
  | {
      networkIds: NetworkId[]
      includePositionTokens?: boolean
    }

export type TokensByIdSelector = typeof tokensByIdSelector
export const tokensByIdSelector = createSelector(
  [
    (state: RootState) => state.tokens.tokenBalances,
    positionTokensSelector,
    positionsFetchedAtSelector,
    (_state: RootState, args: TokensByIdArgs) => (Array.isArray(args) ? args : args.networkIds),
    (_state: RootState, args: TokensByIdArgs) =>
      Array.isArray(args) ? false : (args.includePositionTokens ?? false),
  ],
  (storedBalances, positionTokens, positionsFetchedAt, networkIds, includePositionTokens) => {
    const allStoredBalances = { ...storedBalances }

    // Enrich with position tokens
    // This allows us to have priceUsd and balance for tokens
    // decomposed via positions
    for (const positionToken of Object.values(positionTokens)) {
      if (!networkIds.includes(positionToken.networkId)) {
        continue
      }
      const tokenId = positionToken.tokenId
      const existingToken = allStoredBalances[tokenId]
      const priceUsd = positionToken.priceUsd != '0' ? positionToken.priceUsd : undefined
      if (!existingToken) {
        if (includePositionTokens) {
          allStoredBalances[tokenId] = {
            tokenId,
            address: positionToken.address,
            networkId: positionToken.networkId,
            decimals: positionToken.decimals,
            symbol: positionToken.symbol,
            // TODO: update hooks API to return name too
            name: positionToken.symbol,
            balance: positionToken.balance,
            priceUsd,
            priceFetchedAt: positionsFetchedAt,
            // So we can filter it out of the total balance / or other views
            // i.e. we don't want to count it twice, once as a position and once as a token
            isFromPosition: true,
          }
        }
      } else if (existingToken.priceUsd == null) {
        allStoredBalances[tokenId] = {
          ...existingToken,
          priceUsd,
          priceFetchedAt: positionsFetchedAt,
        }
      }
    }

    const tokenBalances: TokenBalances = {}
    for (const storedState of Object.values(allStoredBalances)) {
      if (
        !storedState ||
        storedState.balance === null ||
        !networkIds.includes(storedState.networkId)
      ) {
        continue
      }
      const priceUsd = new BigNumber(storedState.priceUsd ?? NaN)
      const tokenPriceUsdIsStale =
        (storedState.priceFetchedAt ?? 0) < Date.now() - TIME_UNTIL_TOKEN_INFO_BECOMES_STALE
      tokenBalances[storedState.tokenId] = {
        ...storedState,
        balance: new BigNumber(storedState.balance),
        priceUsd: priceUsd.isNaN() || tokenPriceUsdIsStale ? null : priceUsd,
        lastKnownPriceUsd: !priceUsd.isNaN() ? priceUsd : null,
      }
    }

    return tokenBalances
  },
  {
    memoizeOptions: {
      equalityCheck: (previousValue, currentValue) => {
        if (isNetworkIdList(previousValue) && isNetworkIdList(currentValue)) {
          return _.isEqual(previousValue, currentValue)
        }
        return previousValue === currentValue
      },
      maxSize: DEFAULT_MEMOIZE_MAX_SIZE,
    },
  }
)

export const networksIconSelector = createSelector(
  [(state: RootState) => tokensByIdSelector(state, Object.values(NetworkId))],
  (tokens) => {
    const result: Partial<Record<NetworkId, string>> = {}
    for (const networkId of Object.values(NetworkId)) {
      // We use as network icon the network icon of any token in that network.
      const token = Object.values(tokens).find(
        (token) => token?.networkId === networkId && token.networkIconUrl
      )
      result[networkId] = token?.networkIconUrl
    }

    return result
  }
)

/**
 * Get an object mapping token addresses to token metadata, the user's balance, and its price
 *
 * NOTE: includes only tokens from the default network
 *
 * @deprecated use tokensByIdSelector instead
 */
export const tokensByAddressSelector = createSelector(
  (state: RootState) => tokensByIdSelector(state, [networkConfig.defaultNetworkId]),
  (tokens) => {
    const output: TokenBalancesWithAddress = {}
    for (const token of Object.values(tokens)) {
      if (token?.address) {
        output[token.address] = {
          ...token,
          address: token.address,
          name: token.bridge ? `${token.name} (${token.bridge})` : token.name, // to make sure we show the bridge names even if the old token balances UI (which lacks a "bridge" line) is being used
        }
      }
    }
    return output
  }
)

export const tokensListSelector = createSelector(
  (state: RootState, networkIds: NetworkId[]) => tokensByIdSelector(state, networkIds),
  (tokens) => {
    return Object.values(tokens).map((token) => token!)
  }
)

/**
 * @deprecated use tokensListSelector instead
 */
export const tokensListWithAddressSelector = createSelector(tokensByAddressSelector, (tokens) => {
  return Object.values(tokens).map((token) => token!)
})

const tokensWithLastKnownUsdValueSelector = createSelector(tokensListSelector, (tokens) => {
  return tokens.filter((tokenInfo) =>
    tokenInfo.balance
      .multipliedBy(tokenInfo.lastKnownPriceUsd ?? 0)
      .gt(STABLE_TRANSACTION_MIN_AMOUNT)
  )
})

/**
 * @deprecated use tokensWithTokenBalanceSelector instead
 */
export const tokensWithTokenBalanceAndAddressSelector = createSelector(
  tokensListWithAddressSelector,
  (tokens) => {
    return tokens.filter((tokenInfo) => tokenInfo.balance.gt(TOKEN_MIN_AMOUNT))
  }
)

// Tokens sorted by usd balance (descending)
/**
 * @deprecated
 */
export const tokensByUsdBalanceSelector = createSelector(
  tokensListWithAddressSelector,
  (tokensList) => tokensList.sort(sortByUsdBalance)
)

/**
 * @deprecated
 */
export const tokensByCurrencySelector = createSelector(
  tokensListWithAddressSelector,
  (tokens): CurrencyTokens => {
    const cUsdTokenInfo = tokens.find((token) => token?.symbol === Currency.Dollar)
    const cEurTokenInfo = tokens.find((token) => token?.symbol === Currency.Euro)
    // Currency.Celo === 'cGLD' for legacy reasons, so we just use a hard-coded string.
    const celoTokenInfo = tokens.find((token) => token?.symbol === 'CELO')
    return {
      [Currency.Dollar]: cUsdTokenInfo,
      [Currency.Euro]: cEurTokenInfo,
      [Currency.Celo]: celoTokenInfo,
    }
  }
)

export const lastKnownTokenBalancesSelector = createSelector(
  [tokensListSelector, tokensWithLastKnownUsdValueSelector, usdToLocalCurrencyRateSelector],
  (tokensList, tokensWithLastKnownUsdValue, usdToLocalRate) => {
    if (!usdToLocalRate || tokensList.length === 0) {
      return null
    }

    let totalBalance = new BigNumber(0)
    for (const token of tokensWithLastKnownUsdValue) {
      const tokenAmount = new BigNumber(token.balance)
        .multipliedBy(token.lastKnownPriceUsd ?? 0)
        .multipliedBy(usdToLocalRate)
      totalBalance = totalBalance.plus(tokenAmount)
    }

    return totalBalance
  }
)

export const tokensWithUsdValueSelector = createSelector(
  (state: RootState, networkIds: NetworkId[]) => tokensListSelector(state, networkIds),
  (tokens) => {
    return tokens.filter((tokenInfo) =>
      tokenInfo.balance.multipliedBy(tokenInfo.priceUsd ?? 0).gt(STABLE_TRANSACTION_MIN_AMOUNT)
    ) as TokenBalanceWithPriceUsd[]
  }
)

export const totalTokenBalanceSelector = createSelector(
  [
    (state: RootState, networkIds: NetworkId[]) => tokensListSelector(state, networkIds),
    (state: RootState, networkIds: NetworkId[]) => tokensWithUsdValueSelector(state, networkIds),
    usdToLocalCurrencyRateSelector,
    tokenFetchErrorSelector,
    (_state: RootState, networkIds: NetworkId[]) => networkIds,
  ],
  (tokensList, tokensWithUsdValue, usdToLocalRate, tokenFetchError, networkIds) => {
    if (tokenFetchError) {
      return null
    }

    if (!usdToLocalRate || tokensList.length === 0) {
      return null
    }
    let totalBalance = new BigNumber(0)

    for (const token of tokensWithUsdValue.filter((token) =>
      networkIds.includes(token.networkId)
    )) {
      const tokenAmount = new BigNumber(token.balance)
        .multipliedBy(token.priceUsd)
        .multipliedBy(usdToLocalRate)
      totalBalance = totalBalance.plus(tokenAmount)
    }

    return totalBalance
  }
)

export const tokensWithTokenBalanceSelector = createSelector(
  (state: RootState, networkIds: NetworkId[]) => tokensListSelector(state, networkIds),
  (tokens) => {
    return tokens.filter((token) => token.balance.gt(TOKEN_MIN_AMOUNT))
  }
)

export const swappableFromTokensByNetworkIdSelector = createSelector(
  (state: RootState, networkIds: NetworkId[]) => tokensListSelector(state, networkIds),
  (tokens) => {
    const appVersion = deviceInfoModule.getVersion()

    return (
      tokens
        .filter(
          (tokenInfo) =>
            tokenInfo.isSwappable ||
            tokenInfo.isManuallyImported ||
            tokenInfo.balance.gt(TOKEN_MIN_AMOUNT) ||
            (tokenInfo.minimumAppVersionToSwap &&
              !isVersionBelowMinimum(appVersion, tokenInfo.minimumAppVersionToSwap))
        )
        // sort by balance USD (DESC) then name (ASC), tokens without a priceUsd
        // are pushed last, sorted by name (ASC)
        .sort((token1, token2) => {
          // Sort by USD balance first (higher balances first)
          const token1UsdBalance = token1.balance.multipliedBy(token1.priceUsd ?? 0)
          const token2UsdBalance = token2.balance.multipliedBy(token2.priceUsd ?? 0)
          if (token1UsdBalance.gt(token2UsdBalance)) return -1
          if (token1UsdBalance.lt(token2UsdBalance)) return 1

          // Sort by token balance if there is no priceUsd (higher balances first)
          const balanceCompare = token2.balance.comparedTo(token1.balance)
          if (balanceCompare) {
            return balanceCompare
          }

          // Sort tokens without priceUsd and balance at bottom of list
          if (token1.priceUsd === null || token2.priceUsd === null) {
            // If both prices are null, sort alphabetically by name
            if (!token1.priceUsd && !token2.priceUsd) {
              return token1.name.localeCompare(token2.name)
            }
            // Otherwise, sort such that the token with a non-null price comes first
            return token1.priceUsd === null ? 1 : -1
          }

          // Lastly, sort by name
          return token1.name.localeCompare(token2.name)
        })
    )
  }
)

export const swappableToTokensByNetworkIdSelector = createSelector(
  swappableFromTokensByNetworkIdSelector,
  (tokens) => {
    const appVersion = deviceInfoModule.getVersion()
    return tokens.filter(
      (tokenInfo) =>
        tokenInfo.isSwappable ||
        tokenInfo.isManuallyImported ||
        (tokenInfo.minimumAppVersionToSwap &&
          !isVersionBelowMinimum(appVersion, tokenInfo.minimumAppVersionToSwap))
    )
  }
)

export const cashInTokensByNetworkIdSelector = createSelector(
  (state: RootState, networkIds: NetworkId[]) => tokensListSelector(state, networkIds),
  (tokens) => tokens.filter((tokenInfo) => tokenInfo.isCashInEligible)
)

export const cashOutTokensByNetworkIdSelector = createSelector(
  [
    (state: RootState, networkIds: NetworkId[]) => tokensListSelector(state, networkIds),
    (_state: RootState, _networkIds: NetworkId[], showZeroBalanceTokens: boolean) =>
      showZeroBalanceTokens,
  ],
  (tokens, showZeroBalanceTokens) =>
    tokens.filter(
      (tokenInfo) =>
        ((showZeroBalanceTokens ? tokenInfo.showZeroBalance : false) ||
          tokenInfo.balance.gt(TOKEN_MIN_AMOUNT)) &&
        tokenInfo.isCashOutEligible
    )
)

export const spendTokensByNetworkIdSelector = createSelector(
  (state: RootState, networkIds: NetworkId[]) => tokensListSelector(state, networkIds),
  (tokens) => tokens.filter((tokenInfo) => networkConfig.spendTokenIds.includes(tokenInfo.tokenId))
)

const tokensWithBalanceOrShowZeroBalanceSelector = createSelector(
  (state: RootState, networkIds: NetworkId[]) => tokensListSelector(state, networkIds),
  (tokens) =>
    tokens.filter(
      (tokenInfo) => tokenInfo.balance.gt(TOKEN_MIN_AMOUNT) || tokenInfo.showZeroBalance
    )
)

export type SortedTokensWithBalanceOrShowZeroBalanceSelector =
  typeof sortedTokensWithBalanceOrShowZeroBalanceSelector
export const sortedTokensWithBalanceOrShowZeroBalanceSelector = createSelector(
  tokensWithBalanceOrShowZeroBalanceSelector,
  (tokens) =>
    tokens.sort((token1, token2) => {
      // Sorts by usd balance, then token balance, then zero balance natives by
      // network id, then zero balance non natives by network id
      const usdBalanceCompare = usdBalance(token2).comparedTo(usdBalance(token1))
      if (usdBalanceCompare) {
        return usdBalanceCompare
      }

      const balanceCompare = token2.balance.comparedTo(token1.balance)
      if (balanceCompare) {
        return balanceCompare
      }

      if (token1.isNative && !token2.isNative) {
        return -1
      }
      if (!token1.isNative && token2.isNative) {
        return 1
      }

      return token1.networkId.localeCompare(token2.networkId)
    })
)

export const sortedTokensWithBalanceSelector = createSelector(
  sortedTokensWithBalanceOrShowZeroBalanceSelector,
  (tokens) => tokens.filter((token) => token.balance.gt(TOKEN_MIN_AMOUNT))
)

const feeCurrenciesByNetworkIdSelector = createSelector(
  (state: RootState) => tokensByIdSelector(state, Object.values(NetworkId)),
  (tokens) => {
    const feeCurrenciesByNetworkId: { [key in NetworkId]?: TokenBalance[] } = {}
    // collect fee currencies
    Object.values(tokens).forEach((token) => {
      if (isFeeCurrency(token)) {
        feeCurrenciesByNetworkId[token.networkId] = [
          ...(feeCurrenciesByNetworkId[token.networkId] ?? []),
          token,
        ]
      }
    })

    // sort the fee currencies by native currency first, then by USD balance, and balance otherwise
    Object.entries(feeCurrenciesByNetworkId).forEach(([networkId, tokens]) => {
      feeCurrenciesByNetworkId[networkId as NetworkId] = tokens.sort((a, b) => {
        if (a.isNative && !b.isNative) {
          return -1
        }
        if (b.isNative && !a.isNative) {
          return 1
        }
        if (a.priceUsd && b.priceUsd) {
          const aBalanceUsd = a.balance.multipliedBy(a.priceUsd)
          const bBalanceUsd = b.balance.multipliedBy(b.priceUsd)
          return bBalanceUsd.comparedTo(aBalanceUsd)
        }
        if (a.priceUsd) {
          return -1
        }
        if (b.priceUsd) {
          return 1
        }
        return b.balance.comparedTo(a.balance)
      })
    })

    return feeCurrenciesByNetworkId
  }
)

// for testing
export const _feeCurrenciesByNetworkIdSelector = feeCurrenciesByNetworkIdSelector

export type FeeCurrenciesSelector = typeof feeCurrenciesSelector
export const feeCurrenciesSelector = createSelector(
  feeCurrenciesByNetworkIdSelector,
  (_state: RootState, networkId: NetworkId) => networkId,
  (feeCurrencies, networkId) => {
    return feeCurrencies[networkId] ?? []
  }
)

export const allFeeCurrenciesSelector = createSelector(
  feeCurrenciesByNetworkIdSelector,
  (feeCurrencies) => {
    return Object.values(feeCurrencies).flat()
  }
)

// Note this takes a networkId as parameter
export const feeCurrenciesWithPositiveBalancesSelector = createSelector(
  feeCurrenciesSelector,
  (feeCurrencies) => {
    return feeCurrencies.filter((token) => token.balance.gt(0))
  },
  {
    memoizeOptions: {
      maxSize: DEFAULT_MEMOIZE_MAX_SIZE,
    },
  }
)

export const importedTokensSelector = createSelector(
  [tokensListSelector],
  (tokenList): TokenBalance[] => {
    if (!getFeatureGate(StatsigFeatureGates.SHOW_IMPORT_TOKENS_FLOW)) {
      return []
    }

    return tokenList.filter((token) => token?.isManuallyImported)
  }
)

const getJumpstartEnabledNetworkIds = () =>
  Object.keys(
    getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG])
      .jumpstartContracts
  ) as NetworkId[]

export const jumpstartSendTokensSelector = createSelector(
  [(state) => sortedTokensWithBalanceSelector(state, getJumpstartEnabledNetworkIds())],
  (tokensWithBalance) => {
    return tokensWithBalance.filter((token) => {
      // the jumpstart contract currently requires a token address for the
      // depositERC20 method
      return !!token.address
    })
  }
)
