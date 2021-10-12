import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'
import { TokenBalances } from 'src/tokens/reducer'

export const tokenBalancesSelector = createSelector(
  (state: RootState) => state.tokens.tokenBalances,
  (storedBalances) => {
    const tokenBalances: TokenBalances = {}
    for (const tokenAddress of Object.keys(storedBalances)) {
      const storedState = storedBalances[tokenAddress]
      if (!storedState) {
        continue
      }
      tokenBalances[tokenAddress] = {
        ...storedState,
        balance: storedState?.balance ? new BigNumber(storedState.balance) : null,
        usdPrice: storedState?.usdPrice ? new BigNumber(storedState.usdPrice) : undefined,
      }
    }
    return tokenBalances
  }
)

export const defaultTokenSelector = createSelector(tokenBalancesSelector, (balances) => {
  const usdTokenInfo = Object.values(balances).find((tokenInfo) => tokenInfo?.symbol === 'cUSD')
  if (!usdTokenInfo?.address) {
    throw new Error("cUSD token info not found. Shouldn't happen")
  }
  let maxTokenAddress: string = usdTokenInfo.address
  let maxBalance: BigNumber = usdTokenInfo.balance ?? new BigNumber(0)
  for (const tokenAddress of Object.keys(balances)) {
    const tokenUsdPrice = balances[tokenAddress]?.usdPrice
    const tokenBalance = balances[tokenAddress]?.balance
    if (!tokenUsdPrice || !tokenBalance) {
      continue
    }
    const usdBalance = tokenBalance.multipliedBy(tokenUsdPrice)
    if (usdBalance.gt(maxBalance)) {
      maxTokenAddress = tokenAddress
      maxBalance = usdBalance
    }
  }

  return maxTokenAddress
})
