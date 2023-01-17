import { createSelector } from 'reselect'
import { numberVerifiedCentrallySelector } from 'src/app/selectors'
import { localCurrencyToUsdSelector } from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import { tokensWithTokenBalanceSelector } from 'src/tokens/selectors'

export const getRecentPayments = (state: RootState) => {
  return state.send.recentPayments
}

export const lastUsedCurrencySelector = (state: RootState) => state.send.lastUsedCurrency

export const isSendingSelector = (state: RootState) => {
  return state.send.isSending
}

export const inviteRewardCusdSelector = (state: RootState) => state.send.inviteRewardCusd

export const inviteRewardsEnabledSelector = (state: RootState) => state.send.inviteRewardsEnabled

export const inviteRewardsActiveSelector = createSelector(
  [inviteRewardsEnabledSelector, numberVerifiedCentrallySelector],
  (inviteRewardsEnabled, numberCentrallyVerified) => inviteRewardsEnabled && numberCentrallyVerified
)

export const canSendTokensSelector = createSelector(
  tokensWithTokenBalanceSelector,
  localCurrencyToUsdSelector,
  (tokensList, usdExchangeRate) => {
    return tokensList.length > 0 && usdExchangeRate !== null
  }
)
