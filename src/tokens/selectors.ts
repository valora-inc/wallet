import BigNumber from 'bignumber.js'
import deviceInfoModule from 'react-native-device-info'
import { createSelector } from 'reselect'
import {
  STABLE_TRANSACTION_MIN_AMOUNT,
  TIME_UNTIL_TOKEN_INFO_BECOMES_STALE,
  TOKEN_MIN_AMOUNT,
} from 'src/config'
import { usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import {
  TokenBalance,
  TokenBalances,
  TokenBalancesWithAddress,
  TokenBalanceWithAddress,
} from 'src/tokens/slice'
import { Currency } from 'src/utils/currencies'
import { isVersionBelowMinimum } from 'src/utils/versionCheck'
import { sortByUsdBalance, sortFirstStableThenCeloThenOthersByUsdBalance } from './utils'
import { NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'

type TokenBalanceWithPriceUsd = TokenBalance & {
  priceUsd: BigNumber
}
export type CurrencyTokens = {
  [currency in Currency]: TokenBalanceWithAddress | undefined
}

export const tokenFetchLoadingSelector = (state: RootState) => state.tokens.loading
export const tokenFetchErrorSelector = (state: RootState) => state.tokens.error

/**
 * Selector-like functions suffixed with "wrapper" are higher-order functions which return a selector
 * that only looks at tokens from the specified networkIds. These functions should not be called
 * directly from components, but instead from within hooks
 */
export const tokensByIdSelectorWrapper = (networkIds: NetworkId[]) =>
  createSelector(
    (state: RootState) => state.tokens.tokenBalances,
    (storedBalances) => {
      const tokenBalances: TokenBalances = {}
      for (const storedState of Object.values(storedBalances)) {
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
  tokensByIdSelectorWrapper([networkConfig.defaultNetworkId]),
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

export const tokensListSelectorWrapper = (networkIds: NetworkId[]) =>
  createSelector(tokensByIdSelectorWrapper(networkIds), (tokens) => {
    return Object.values(tokens).map((token) => token!)
  })

/**
 * @deprecated use tokensListSelector instead
 */
export const tokensListWithAddressSelector = createSelector(tokensByAddressSelector, (tokens) => {
  return Object.values(tokens).map((token) => token!)
})

/**
 * @deprecated
 */
export const tokensBySymbolSelector = createSelector(
  tokensListWithAddressSelector,
  (
    tokens
  ): {
    [symbol: string]: TokenBalanceWithAddress
  } => {
    return tokens.reduce(
      (acc, token) => ({
        ...acc,
        [token.symbol]: token,
      }),
      {}
    )
  }
)

/**
 * @deprecated
 */
export const tokensWithLastKnownUsdValueSelector = createSelector(
  tokensListWithAddressSelector,
  (tokens) => {
    return tokens.filter((tokenInfo) =>
      tokenInfo.balance
        .multipliedBy(tokenInfo.lastKnownPriceUsd ?? 0)
        .gt(STABLE_TRANSACTION_MIN_AMOUNT)
    )
  }
)

/**
 * @deprecated use tokensWithTokenBalanceSelector instead
 */
export const tokensWithTokenBalanceAndAddressSelector = createSelector(
  tokensListWithAddressSelector,
  (tokens) => {
    return tokens.filter((tokenInfo) => tokenInfo.balance.gt(TOKEN_MIN_AMOUNT))
  }
)

/**
 * @deprecated
 */
export const tokensSortedToShowInSendSelector = createSelector(
  tokensWithTokenBalanceAndAddressSelector,
  (tokens) => tokens.sort(sortFirstStableThenCeloThenOthersByUsdBalance)
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
export const coreTokensSelector = createSelector(tokensByUsdBalanceSelector, (tokens) => {
  return tokens.filter((tokenInfo) => tokenInfo.isCoreToken === true)
})

/**
 * @deprecated
 */
export const stablecoinsSelector = createSelector(coreTokensSelector, (tokens) => {
  return tokens.filter((tokenInfo) => tokenInfo.symbol !== 'CELO')
})

/**
 * @deprecated
 */
export const celoAddressSelector = createSelector(coreTokensSelector, (tokens) => {
  return tokens.find((tokenInfo) => tokenInfo.symbol === 'CELO')?.address
})

function tokenCompareByUsdBalanceThenByName(token1: TokenBalance, token2: TokenBalance) {
  const token1UsdBalance = token1.balance.multipliedBy(token1.priceUsd ?? 0)
  const token2UsdBalance = token2.balance.multipliedBy(token2.priceUsd ?? 0)
  const priceUsdComparison = token2UsdBalance.comparedTo(token1UsdBalance)
  if (priceUsdComparison === 0) {
    const token1Name = token1.name ?? 'ZZ'
    const token2Name = token2.name ?? 'ZZ'
    return token1Name.localeCompare(token2Name)
  } else {
    return priceUsdComparison
  }
}

/**
 * @deprecated
 */
export const swappableTokensSelector = createSelector(tokensByUsdBalanceSelector, (tokens) => {
  const appVersion = deviceInfoModule.getVersion()

  return tokens
    .filter(
      (tokenInfo) =>
        tokenInfo.isSwappable ||
        (tokenInfo.minimumAppVersionToSwap &&
          !isVersionBelowMinimum(appVersion, tokenInfo.minimumAppVersionToSwap))
    )
    .sort(tokenCompareByUsdBalanceThenByName)
})

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

// Returns the token with the highest usd balance to use as default.
/**
 * @deprecated
 */
export const defaultTokenToSendSelector = createSelector(
  tokensSortedToShowInSendSelector,
  stablecoinsSelector,
  (tokens, stableCoins) => {
    if (tokens.length === 0) {
      // TODO: ideally we return based on location - cUSD for now.
      return stableCoins.find((coin) => coin.symbol === 'cUSD')?.address ?? ''
    }
    return tokens[0].address
  }
)

/**
 * @deprecated
 */
export const lastKnownTokenBalancesSelector = createSelector(
  [
    tokensListWithAddressSelector,
    tokensWithLastKnownUsdValueSelector,
    usdToLocalCurrencyRateSelector,
  ],
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

export const tokensWithUsdValueSelectorWrapper = (networkIds: NetworkId[]) =>
  createSelector(tokensListSelectorWrapper(networkIds), (tokens) => {
    return tokens.filter((tokenInfo) =>
      tokenInfo.balance.multipliedBy(tokenInfo.priceUsd ?? 0).gt(STABLE_TRANSACTION_MIN_AMOUNT)
    ) as TokenBalanceWithPriceUsd[]
  })

export const totalTokenBalanceSelectorWrapper = (networkIds: NetworkId[]) =>
  createSelector(
    [
      tokensListSelectorWrapper(networkIds),
      tokensWithUsdValueSelectorWrapper(networkIds),
      usdToLocalCurrencyRateSelector,
      tokenFetchErrorSelector,
      tokenFetchLoadingSelector,
    ],
    (tokensList, tokensWithUsdValue, usdToLocalRate, tokenFetchError, tokenFetchLoading) => {
      if (tokenFetchError || tokenFetchLoading) {
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

export const tokensInfoUnavailableSelectorWrapper = (networkIds: NetworkId[]) =>
  createSelector(totalTokenBalanceSelectorWrapper(networkIds), (totalBalance) => {
    // The total balance is null if there was an error fetching the tokens
    // info and there are no cached values
    return totalBalance === null
  })

export const visualizeNFTsEnabledInHomeAssetsPageSelector = (state: RootState) =>
  state.app.visualizeNFTsEnabledInHomeAssetsPage
