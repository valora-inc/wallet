import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FiatConnectQuoteError, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { CiCoCurrency } from 'src/utils/currencies'

export interface State {
  quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[]
  quotesLoading: boolean
  quotesError: string | null
}

const initialState: State = {
  quotes: [],
  quotesLoading: false,
  quotesError: null,
}

export interface FetchQuotesAction {
  flow: CICOFlow
  digitalAsset: CiCoCurrency
  cryptoAmount: number
}

export interface FetchFiatConnectQuotesCompletedAction {
  quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[]
}

export interface FetchFiatConnectQuotesFailedAction {
  error: string
}

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
    fetchFiatConnectQuotesFailed: (
      state,
      action: PayloadAction<FetchFiatConnectQuotesFailedAction>
    ) => {
      state.quotesLoading = false
      state.quotesError = action.payload.error
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
} = slice.actions

export default slice.reducer
