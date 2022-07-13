import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FiatConnectQuoteError, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { CiCoCurrency } from 'src/utils/currencies'

export interface FiatConnectTransfer {
  flow: CICOFlow
  quoteId: string
  isSending: boolean
  failed: boolean
  txHash: string | null // only for cash outs, the hash of the tx to send crypto to the provider
}
export interface State {
  quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[]
  quotesLoading: boolean
  quotesError: string | null
  transfer: FiatConnectTransfer | null
}

const initialState: State = {
  quotes: [],
  quotesLoading: false,
  quotesError: null,
  transfer: null,
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

export interface StartFiatConnectTransferAction {
  flow: CICOFlow
  fiatConnectQuote: FiatConnectQuote
  quoteId: string
  fiatAccountId: string
}

export interface FiatConnectTransferFailedAction {
  flow: CICOFlow
  quoteId: string
}

export interface FiatConnectTransferSuccessAction {
  flow: CICOFlow
  quoteId: string
  txHash: string | null
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
    startFiatConnectTransfer: (state, action: PayloadAction<StartFiatConnectTransferAction>) => {
      state.transfer = {
        quoteId: action.payload.quoteId,
        flow: action.payload.flow,
        isSending: true,
        failed: false,
        txHash: null,
      }
    },
    fiatConnectTransferFailed: (state, action: PayloadAction<FiatConnectTransferFailedAction>) => {
      state.transfer = {
        quoteId: action.payload.quoteId,
        flow: action.payload.flow,
        isSending: false,
        failed: true,
        txHash: null,
      }
    },
    fiatConnectTransferSuccess: (
      state,
      action: PayloadAction<FiatConnectTransferSuccessAction>
    ) => {
      state.transfer = {
        quoteId: action.payload.quoteId,
        flow: action.payload.flow,
        isSending: false,
        failed: false,
        txHash: action.payload.txHash,
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'fiatConnect'),
      quotesLoading: false,
      quotesError: null,
      // transfer: null,
    }))
  },
})

export const {
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  startFiatConnectTransfer,
  fiatConnectTransferFailed,
  fiatConnectTransferSuccess,
} = slice.actions

export default slice.reducer
