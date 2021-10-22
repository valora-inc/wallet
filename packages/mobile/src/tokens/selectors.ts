import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { RootState } from 'src/redux/reducers'
import { TokenBalances } from 'src/tokens/reducer'
import { Currency } from 'src/utils/currencies'
import { isDefined } from 'src/utils/utils'

// This selector maps usdPrice and balance fields from string to BigNumber and filters tokens without those values
export const tokensByAddressSelector = createSelector(
  (state: RootState) => state.tokens.tokenBalances,
  (storedBalances) => {
    const tokenBalances: TokenBalances = {}
    for (const tokenAddress of Object.keys(storedBalances)) {
      const storedState = storedBalances[tokenAddress]
      if (!storedState || !isDefined(storedState.balance) || !isDefined(storedState.usdPrice)) {
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

export const defaultTokenSelector = createSelector(tokensListSelector, (tokens) => {
  let maxTokenAddress: string = tokens[0].address
  let maxBalance: BigNumber = tokens[0].balance.multipliedBy(tokens[0].usdPrice)
  for (const token of tokens) {
    const usdBalance = token.balance.multipliedBy(token.usdPrice)
    if (usdBalance.gt(maxBalance)) {
      maxTokenAddress = token.address
      maxBalance = usdBalance
    }
  }

  return maxTokenAddress
})
