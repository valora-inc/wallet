import { createSelector } from 'reselect'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import { usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import { tokensWithTokenBalanceAndAddressSelector } from 'src/tokens/selectors'
import { InviteRewardsType } from './types'

export const getRecentPayments = (state: RootState) => {
  return state.send.recentPayments
}

export const lastUsedCurrencySelector = (state: RootState) => state.send.lastUsedCurrency

export const isSendingSelector = (state: RootState) => {
  return state.send.isSending
}

export const inviteRewardCusdSelector = (state: RootState) => state.send.inviteRewardCusd

export const inviteRewardsTypeSelector = (state: RootState) => {
  switch (state.send.inviteRewardsVersion) {
    case 'v4':
      return InviteRewardsType.NFT
    case 'v5':
      return InviteRewardsType.CUSD
    default:
      return InviteRewardsType.NONE
  }
}

export const inviteRewardsActiveSelector = createSelector(
  [inviteRewardsTypeSelector, phoneNumberVerifiedSelector],
  (inviteRewardsType, numberCentrallyVerified) =>
    inviteRewardsType !== InviteRewardsType.NONE && numberCentrallyVerified
)

export const canSendTokensSelector = createSelector(
  tokensWithTokenBalanceAndAddressSelector,
  usdToLocalCurrencyRateSelector,
  (tokensList, usdExchangeRate) => {
    return tokensList.length > 0 && usdExchangeRate !== null
  }
)
