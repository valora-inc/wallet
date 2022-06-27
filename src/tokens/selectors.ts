import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import {
  STABLE_TRANSACTION_MIN_AMOUNT,
  TIME_UNTIL_TOKEN_INFO_BECOMES_STALE,
  TOKEN_MIN_AMOUNT,
} from 'src/config'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import { TokenBalance, TokenBalances } from 'src/tokens/slice'
import { Currency } from 'src/utils/currencies'
import { sortByUsdBalance, sortFirstStableThenCeloThenOthersByUsdBalance } from './utils'

export const tokenFetchLoadingSelector = (state: RootState) => state.tokens.loading
export const tokenFetchErrorSelector = (state: RootState) => state.tokens.error

// This selector maps usdPrice and balance fields from string to BigNumber and filters tokens without those values
export const tokensByAddressSelector = createSelector(
  (state: RootState) => state.tokens.tokenBalances,
  (storedBalances) => {
    const tokenBalances: TokenBalances = {}
    for (const [tokenAddress, storedState] of Object.entries(storedBalances)) {
      if (!storedState || storedState.balance === null) {
        continue
      }
      const usdPrice = new BigNumber(storedState.usdPrice)
      const tokenUsdPriceIsStale =
        (storedState.priceFetchedAt ?? 0) < Date.now() - TIME_UNTIL_TOKEN_INFO_BECOMES_STALE
      tokenBalances[tokenAddress] = {
        ...storedState,
        balance: new BigNumber(storedState.balance),
        usdPrice: usdPrice,
        stalePrice: tokenUsdPriceIsStale,
      }
    }
    return tokenBalances
  }
)

export const tokensListSelector = createSelector(tokensByAddressSelector, (tokens) => {
  return Object.values(tokens).map((token) => token!)
})

type TokenBalanceWithUsdPrice = TokenBalance & {
  usdPrice: BigNumber
}

export const tokensWithUsdValueSelector = createSelector(tokensListSelector, (tokens) => {
  return tokens.filter((tokenInfo) =>
    tokenInfo.balance.multipliedBy(tokenInfo.usdPrice ?? 0).gt(STABLE_TRANSACTION_MIN_AMOUNT)
  ) as TokenBalanceWithUsdPrice[]
})

export const tokensWithFreshPricesSelector = createSelector(tokensListSelector, (tokens) => {
  return tokens.filter(
    (tokenInfo) =>
      !tokenInfo.stalePrice &&
      tokenInfo.balance.multipliedBy(tokenInfo.usdPrice ?? 0).gt(STABLE_TRANSACTION_MIN_AMOUNT)
  ) as TokenBalanceWithUsdPrice[]
})

export const tokensWithTokenBalanceSelector = createSelector(tokensListSelector, (tokens) => {
  return tokens.filter((tokenInfo) => tokenInfo.balance.gt(TOKEN_MIN_AMOUNT))
})

export const tokensSortedToShowInSendSelector = createSelector(
  tokensWithTokenBalanceSelector,
  (tokens) => tokens.sort(sortFirstStableThenCeloThenOthersByUsdBalance)
)

// Tokens sorted by usd balance (descending)
export const tokensByUsdBalanceSelector = createSelector(tokensListSelector, (tokensList) =>
  tokensList.sort(sortByUsdBalance)
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

export const tokensByCurrencySelector = createSelector(tokensListSelector, (tokens) => {
  const cUsdTokenInfo = tokens.find((token) => token?.symbol === Currency.Dollar)
  const cEurTokenInfo = tokens.find((token) => token?.symbol === Currency.Euro)
  // Currency.Celo === 'cGLD' for legacy reasons, so we just use a hard-coded string.
  const celoTokenInfo = tokens.find((token) => token?.symbol === 'CELO')
  return {
    [Currency.Dollar]: cUsdTokenInfo,
    [Currency.Euro]: cEurTokenInfo,
    [Currency.Celo]: celoTokenInfo,
  }
})

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

export const totalTokenBalanceSelector = createSelector(
  [
    tokensListSelector,
    tokensWithUsdValueSelector,
    localCurrencyExchangeRatesSelector,
    tokenFetchErrorSelector,
    tokenFetchLoadingSelector,
  ],
  (tokensList, tokensWithUsdValue, exchangeRate, tokenFetchError, tokenFetchLoading) => {
    const usdRate = exchangeRate[Currency.Dollar]
    if (!usdRate || tokensList.length === 0) {
      return null
    }
    let totalBalance = new BigNumber(0)

    for (const token of tokensWithUsdValue) {
      const tokenAmount = new BigNumber(token.balance)
        .multipliedBy(token.usdPrice)
        .multipliedBy(usdRate)
      totalBalance = totalBalance.plus(tokenAmount)
    }

    if (tokenFetchError || tokenFetchLoading) {
      return null
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
