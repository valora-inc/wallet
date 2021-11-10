import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import { TokenBalances } from 'src/tokens/reducer'
import { Currency } from 'src/utils/currencies'

// This selector maps usdPrice and balance fields from string to BigNumber and filters tokens without those values
export const tokensByAddressSelector = createSelector(
  (state: RootState) => state.tokens.tokenBalances,
  (storedBalances) => {
    const tokenBalances: TokenBalances = {}
    for (const [tokenAddress, storedState] of Object.entries(storedBalances)) {
      if (!storedState || storedState.balance === null) {
        continue
      }
      tokenBalances[tokenAddress] = {
        ...storedState,
        balance: new BigNumber(storedState.balance),
        usdPrice: new BigNumber(storedState.usdPrice),
      }
    }
    return tokenBalances
  }
)

export const tokensListSelector = createSelector(tokensByAddressSelector, (tokens) => {
  return Object.values(tokens).map((token) => token!)
})

export const tokensWithBalanceSelector = createSelector(tokensListSelector, (tokens) => {
  return tokens.filter((tokenInfo) =>
    tokenInfo.balance.multipliedBy(tokenInfo.usdPrice).gt(STABLE_TRANSACTION_MIN_AMOUNT)
  )
})

// Tokens sorted by usd balance (descending)
export const tokensByUsdBalanceSelector = createSelector(tokensListSelector, (tokensList) => {
  return tokensList.sort((a, b) =>
    b.balance.multipliedBy(b.usdPrice).comparedTo(a.balance.multipliedBy(a.usdPrice))
  )
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
export const defaultTokenSelector = createSelector(tokensListSelector, (tokens) => {
  let maxTokenAddress: string = ''
  let maxBalance: BigNumber = new BigNumber(-1)
  for (const token of tokens) {
    const usdBalance = token.balance.multipliedBy(token.usdPrice)
    if (usdBalance.gt(maxBalance)) {
      maxTokenAddress = token.address
      maxBalance = usdBalance
    }
  }

  return maxTokenAddress
})

export const totalTokenBalanceSelector = createSelector(
  [tokensWithBalanceSelector, localCurrencyExchangeRatesSelector],
  (tokenBalances, exchangeRate) => {
    const usdRate = exchangeRate[Currency.Dollar]
    if (!usdRate) {
      return null
    }
    let totalBalance = new BigNumber(0)

    for (const token of tokenBalances) {
      const tokenAmount = new BigNumber(token.balance)
        .multipliedBy(token.usdPrice)
        .multipliedBy(usdRate)
      totalBalance = totalBalance.plus(tokenAmount)
    }

    return totalBalance.toFixed(2)
  }
)

export const tokenErrorSelector = (state: RootState) => state.tokens.error
export const tokenLoadingSelector = (state: RootState) => state.tokens.loading
