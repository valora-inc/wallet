import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'

export const tokenBalancesSelector = (state: RootState) => state.tokens.tokenBalances

export const defaultTokenSelector = createSelector(tokenBalancesSelector, (balances) => {
  const usdTokenInfo = Object.values(balances).find((tokenInfo) => tokenInfo?.symbol === 'cUSD')
  if (!usdTokenInfo?.address) {
    throw new Error("cUSD token info not found. Shouldn't happen")
  }
  let maxTokenAddress: string = usdTokenInfo.address
  let maxBalance: number = usdTokenInfo.balance
  for (const tokenAddress of Object.keys(balances)) {
    const tokenUsdPrice = balances[tokenAddress]?.usdPrice
    const tokenBalance = balances[tokenAddress]?.balance
    if (!tokenUsdPrice || !tokenBalance) {
      continue
    }
    const usdBalance = tokenBalance * tokenUsdPrice
    if (usdBalance > maxBalance) {
      maxTokenAddress = tokenAddress
      maxBalance = usdBalance
    }
  }

  return maxTokenAddress
})
