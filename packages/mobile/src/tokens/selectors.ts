import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import {
  STABLE_TRANSACTION_MIN_AMOUNT,
  TIME_UNTIL_TOKEN_INFO_BECOMES_STALE,
  TOKEN_MIN_AMOUNT,
} from 'src/config'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import { TokenBalance, TokenBalances } from 'src/tokens/reducer'
import { Currency } from 'src/utils/currencies'
import { sortByUsdBalance } from './utils'

export const tokenFetchLoadingSelector = (state: RootState) => state.tokens.loading
export const tokenFetchErrorSelector = (state: RootState) => state.tokens.error
export const lastTokenFetchSelector = (state: RootState) => state.tokens.lastSuccessfulFetch ?? 0

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
        usdPrice: usdPrice.isNaN() || tokenUsdPriceIsStale ? null : usdPrice,
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

export const tokensWithTokenBalanceSelector = createSelector(tokensListSelector, (tokens) => {
  return tokens.filter((tokenInfo) => tokenInfo.balance.gt(TOKEN_MIN_AMOUNT))
})

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
export const defaultTokenSelector = createSelector(tokensWithTokenBalanceSelector, (tokens) => {
  let maxTokenAddress: string = ''
  let maxBalance: BigNumber = new BigNumber(-1)
  for (const token of tokens) {
    const usdBalance = token.balance.multipliedBy(token.usdPrice ?? 0)
    if (usdBalance.gt(maxBalance)) {
      maxTokenAddress = token.address
      maxBalance = usdBalance
    }
  }

  return maxTokenAddress
})

export const totalTokenBalanceSelector = createSelector(
  [tokensWithUsdValueSelector, localCurrencyExchangeRatesSelector, tokenFetchErrorSelector],
  (tokensWithUsdValue, exchangeRate, tokenFetchError) => {
    const usdRate = exchangeRate[Currency.Dollar]
    if (!usdRate) {
      return null
    }
    let totalBalance = new BigNumber(0)

    for (const token of tokensWithUsdValue) {
      const tokenAmount = new BigNumber(token.balance)
        .multipliedBy(token.usdPrice)
        .multipliedBy(usdRate)
      totalBalance = totalBalance.plus(tokenAmount)
    }

    if (totalBalance.isZero() && tokenFetchError) {
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
