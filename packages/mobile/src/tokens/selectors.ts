import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { RootState } from 'src/redux/reducers'
import { TokenBalances } from 'src/tokens/reducer'
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

export const defaultTokenSelector = createSelector(tokensListSelector, (tokens) => {
  const usdTokenInfo = tokens.find((tokenInfo) => tokenInfo.symbol === 'cUSD')
  if (!usdTokenInfo) {
    throw new Error("cUSD token info not found. Shouldn't happen")
  }
  let maxTokenAddress: string = usdTokenInfo.address
  let maxBalance: BigNumber = usdTokenInfo.balance ?? new BigNumber(0)
  for (const token of tokens) {
    const tokenUsdPrice = token.usdPrice
    const tokenBalance = token.balance
    if (!tokenUsdPrice || !tokenBalance) {
      continue
    }
    const usdBalance = tokenBalance.multipliedBy(tokenUsdPrice)
    if (usdBalance.gt(maxBalance)) {
      maxTokenAddress = token.address
      maxBalance = usdBalance
    }
  }

  return maxTokenAddress
})
