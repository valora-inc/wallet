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

type TokenBalanceWithPriceUsd = TokenBalance & {
  priceUsd: BigNumber
}

export type CurrencyTokens = {
  [currency in Currency]: TokenBalanceWithAddress | undefined
}

export const tokenFetchLoadingSelector = (state: RootState) => state.tokens.loading
export const tokenFetchErrorSelector = (state: RootState) => state.tokens.error

export const tokensByIdSelector = createSelector(
  (state: RootState) => state.tokens.tokenBalances,
  (storedBalances) => {
    const tokenBalances: TokenBalances = {}
    for (const storedState of Object.values(storedBalances)) {
      if (!storedState || storedState.balance === null) {
        continue
      }
      const priceUsd = new BigNumber(storedState.priceUsd)
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

// This selector maps priceUsd and balance fields from string to BigNumber and filters tokens without those values
/**
 * @deprecated use tokensByIdSelector instead
 */
export const tokensByAddressSelector = createSelector(
  (state: RootState) => state.tokens.tokenBalances,
  (storedBalances) => {
    const tokenBalances: TokenBalancesWithAddress = {}
    for (const storedState of Object.values(storedBalances)) {
      if (!storedState || storedState.balance === null || !storedState.address) {
        continue
      }
      const priceUsd = new BigNumber(storedState.priceUsd)

      const tokenPriceUsdIsStale =
        (storedState.priceFetchedAt ?? 0) < Date.now() - TIME_UNTIL_TOKEN_INFO_BECOMES_STALE
      tokenBalances[storedState.address] = {
        ...storedState,
        address: storedState.address, // TS complains if this isn't explicitly included, despite it necessarily being non-null
        name: storedState.bridge ? `${storedState.name} (${storedState.bridge})` : storedState.name,
        balance: new BigNumber(storedState.balance),
        priceUsd: priceUsd.isNaN() || tokenPriceUsdIsStale ? null : priceUsd,
        lastKnownPriceUsd: !priceUsd.isNaN() ? priceUsd : null,
      }
    }
    return tokenBalances
  }
)

export const tokensListSelector = createSelector(tokensByIdSelector, (tokens) => {
  return Object.values(tokens).map((token) => token!)
})

/**
 * @deprecated use tokensListSelector instead
 */
export const tokensListWithAddressSelector = createSelector(tokensByAddressSelector, (tokens) => {
  return Object.values(tokens).map((token) => token!)
})

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

export const tokensWithUsdValueSelector = createSelector(tokensListSelector, (tokens) => {
  return tokens.filter((tokenInfo) =>
    tokenInfo.balance.multipliedBy(tokenInfo.priceUsd ?? 0).gt(STABLE_TRANSACTION_MIN_AMOUNT)
  ) as TokenBalanceWithPriceUsd[]
})

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

export const stalePriceSelector = createSelector(tokensListSelector, (tokens) => {
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
})

export const tokensWithTokenBalanceSelector = createSelector(tokensListSelector, (tokens) => {
  return tokens.filter((tokenInfo) => tokenInfo.balance.gt(TOKEN_MIN_AMOUNT))
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

export const tokensSortedToShowInSendSelector = createSelector(
  tokensWithTokenBalanceAndAddressSelector,
  (tokens) => tokens.sort(sortFirstStableThenCeloThenOthersByUsdBalance)
)

// Tokens sorted by usd balance (descending)
export const tokensByUsdBalanceSelector = createSelector(
  tokensListWithAddressSelector,
  (tokensList) => tokensList.sort(sortByUsdBalance)
)

export const coreTokensSelector = createSelector(tokensByUsdBalanceSelector, (tokens) => {
  return tokens.filter((tokenInfo) => tokenInfo.isCoreToken === true)
})

export const stablecoinsSelector = createSelector(coreTokensSelector, (tokens) => {
  return tokens.filter((tokenInfo) => tokenInfo.symbol !== 'CELO')
})

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

export const totalTokenBalanceSelector = createSelector(
  [
    tokensListSelector,
    tokensWithUsdValueSelector,
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

    for (const token of tokensWithUsdValue) {
      const tokenAmount = new BigNumber(token.balance)
        .multipliedBy(token.priceUsd)
        .multipliedBy(usdToLocalRate)
      totalBalance = totalBalance.plus(tokenAmount)
    }

    return totalBalance
  }
)

export const tokensInfoUnavailableSelector = createSelector(
  totalTokenBalanceSelector,
  (totalBalance) => {
    // The total balance is null if there was an error fetching the tokens
    // info and there are no cached values
    return totalBalance === null
  }
)

export const visualizeNFTsEnabledInHomeAssetsPageSelector = (state: RootState) =>
  state.app.visualizeNFTsEnabledInHomeAssetsPage
