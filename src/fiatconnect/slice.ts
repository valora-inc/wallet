import { FiatAccountType, ObfuscatedFiatAccountData } from '@fiatconnect/fiatconnect-types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FiatConnectQuoteError, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { CiCoCurrency } from 'src/utils/currencies'

export interface State {
  quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[]
  quotesLoading: boolean
  quotesError: string | null
  fiatAccount: ObfuscatedFiatAccountData | null
  fiatAccountLoading: boolean
  fiatAccountError: string | null
  mostRecentFiatAccountIds: FiatAccount[]
}

const initialState: State = {
  quotes: [],
  quotesLoading: false,
  quotesError: null,
  fiatAccount: null,
  fiatAccountLoading: false,
  fiatAccountError: null,
  mostRecentFiatAccountIds: [],
}

export interface FiatAccount {
  fiatAccountId: string
  providerId: string
  fiatAccountType: FiatAccountType
}

export interface FetchQuotesAction {
  flow: CICOFlow
  digitalAsset: CiCoCurrency
  cryptoAmount: number
  providerIds?: string[]
}

export type FetchQuoteAndFiatAccountAction = FiatAccount & {
  flow: CICOFlow
  digitalAsset: CiCoCurrency
  cryptoAmount: number
}

export interface FetchQuoteAndFiatAccountCompletedAction {
  fiatAccount: ObfuscatedFiatAccountData | null
}

export interface FetchFiatConnectQuotesCompletedAction {
  quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[]
}

export interface FetchFailedAction {
  error: string
}

export type FiatAccountAddedAction = FiatAccount

export const slice = createSlice({
  name: 'fiatConnect',
  initialState,
  reducers: {
    fetchFiatConnectQuotes: (state, action: PayloadAction<FetchQuotesAction>) => {
      state.quotesLoading = true
      state.quotesError = null
    },
    fetchFiatConnectQuotesCompleted: (
      state,
      action: PayloadAction<FetchFiatConnectQuotesCompletedAction>
    ) => {
      state.quotesLoading = false
      state.quotesError = null
      state.quotes = action.payload.quotes
    },
    fetchFiatConnectQuotesFailed: (state, action: PayloadAction<FetchFailedAction>) => {
      state.quotesLoading = false
      state.quotesError = action.payload.error
    },
    fiatAccountUsed: (state, action: PayloadAction<FiatAccountAddedAction>) => {
      state.mostRecentFiatAccountIds = [
        action.payload,
        ...state.mostRecentFiatAccountIds.filter(
          (fiatAccount) =>
            fiatAccount.providerId !== action.payload.providerId &&
            fiatAccount.fiatAccountId !== action.payload.fiatAccountId
        ),
      ]
    },
    fiatAccountRemove: (state, action: PayloadAction<FiatAccountAddedAction>) => {
      state.mostRecentFiatAccountIds = [
        ...state.mostRecentFiatAccountIds.filter(
          (fiatAccount) =>
            fiatAccount.providerId !== action.payload.providerId &&
            fiatAccount.fiatAccountId !== action.payload.fiatAccountId
        ),
      ]
    },
    fetchQuoteAndFiatAccount: (state, action: PayloadAction<FetchQuoteAndFiatAccountAction>) => {
      state.fiatAccountLoading = true
      state.fiatAccountError = null
    },
    fetchQuoteAndFiatAccountCompleted: (
      state,
      action: PayloadAction<FetchQuoteAndFiatAccountCompletedAction>
    ) => {
      state.fiatAccountLoading = false
      state.fiatAccountError = null
      state.fiatAccount = action.payload.fiatAccount
    },
    fetchQuoteAndFiatAccountFailed: (state, action: PayloadAction<FetchFailedAction>) => {
      state.fiatAccountLoading = false
      state.fiatAccountError = action.payload.error
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'fiatConnect'),
      quotesLoading: false,
      quotesError: null,
    }))
  },
})

export const {
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  fiatAccountUsed,
  fiatAccountRemove,
  fetchQuoteAndFiatAccount,
  fetchQuoteAndFiatAccountCompleted,
  fetchQuoteAndFiatAccountFailed,
} = slice.actions

export default slice.reducer
