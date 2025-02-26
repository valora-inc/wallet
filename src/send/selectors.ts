import { createSelector } from 'reselect'
import { usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import { tokensWithTokenBalanceAndAddressSelector } from 'src/tokens/selectors'

export const getRecentPayments = (state: RootState) => {
  return state.send.recentPayments
}

export const lastUsedTokenIdSelector = (state: RootState) => state.send.lastUsedTokenId

export const isSendingSelector = (state: RootState) => {
  return state.send.isSending
}

export const canSendTokensSelector = createSelector(
  tokensWithTokenBalanceAndAddressSelector,
  usdToLocalCurrencyRateSelector,
  (tokensList, usdExchangeRate) => {
    return tokensList.length > 0 && usdExchangeRate !== null
  }
)
