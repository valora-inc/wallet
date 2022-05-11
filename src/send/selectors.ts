import { createSelector } from 'reselect'
import { localCurrencyToUsdSelector } from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import { tokensWithTokenBalanceSelector } from 'src/tokens/selectors'

export const getRecentPayments = (state: RootState) => {
  return state.send.recentPayments
}

export const isSendingSelector = (state: RootState) => {
  return state.send.isSending
}

export const inviteRewardCusdSelector = (state: RootState) => state.send.inviteRewardCusd

export const inviteRewardsActiveSelector = (state: RootState) => state.send.inviteRewardsEnabled

export const canSendTokensSelector = createSelector(
  tokensWithTokenBalanceSelector,
  localCurrencyToUsdSelector,
  (tokensList, usdExchangeRate) => {
    return tokensList.length > 0 && usdExchangeRate !== null
  }
)
