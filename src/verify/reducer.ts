import { isBalanceSufficientForSigRetrieval } from '@celo/identity/lib/odis/phone-number-identifier'
import { createAction, createReducer, createSelector } from '@reduxjs/toolkit'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { cUsdBalanceSelector } from 'src/stableToken/selectors'

const rehydrate = createAction<any>(REHYDRATE)

export interface KomenciContext {
  unverifiedMtwAddress: string | null
}

export interface State {
  komenci: KomenciContext
}

const initialState: State = {
  komenci: {
    unverifiedMtwAddress: null,
  },
}

export const reducer = createReducer(initialState, (builder) => {
  builder.addCase(rehydrate, (state, action) => {
    // hack to allow rehydrate actions here
    const hydrated = getRehydratePayload(action as unknown as RehydrateAction, 'verify')
    return {
      komenci: {
        ...state.komenci,
        ...hydrated.komenci,
      },
    }
  })
})

export const komenciContextSelector = (state: RootState) => state.verify.komenci

export const isBalanceSufficientForSigRetrievalSelector = createSelector(
  [cUsdBalanceSelector, celoTokenBalanceSelector],
  (cUsdBalance, celoTokenBalance) =>
    isBalanceSufficientForSigRetrieval(cUsdBalance || 0, celoTokenBalance || 0)
)
