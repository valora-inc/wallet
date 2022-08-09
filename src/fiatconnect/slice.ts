import {
  FiatAccountType,
  FiatType,
  ObfuscatedFiatAccountData,
} from '@fiatconnect/fiatconnect-types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { isEqual } from 'lodash'
import {
  FiatConnectProviderInfo,
  FiatConnectQuoteError,
  FiatConnectQuoteSuccess,
} from 'src/fiatconnect'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { CiCoCurrency, Currency } from 'src/utils/currencies'

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
  providers: FiatConnectProviderInfo[] | null
  cachedFiatAccountUses: CachedFiatAccountUse[]
  attemptReturnUserFlowLoading: boolean
  selectFiatConnectQuoteLoading: boolean
}

const initialState: State = {
  quotes: [],
  quotesLoading: false,
  quotesError: null,
  transfer: null,
  providers: null,
  cachedFiatAccountUses: [],
  attemptReturnUserFlowLoading: false,
  selectFiatConnectQuoteLoading: false,
}

export type FiatAccount = ObfuscatedFiatAccountData & {
  providerId: string
}

export interface CachedFiatAccountUse {
  fiatAccountId: string
  providerId: string
  flow: string
  cryptoType: Currency
  fiatType: FiatType
  fiatAccountType: FiatAccountType
}

export interface FetchQuotesAction {
  flow: CICOFlow
  digitalAsset: CiCoCurrency
  cryptoAmount: number
  providerIds?: string[]
}

export interface AttemptReturnUserFlowAction {
  flow: CICOFlow
  selectedCrypto: Currency
  amount: {
    crypto: number
    fiat: number
  }
  providerId: string
  fiatAccountId: string
  fiatAccountType: FiatAccountType
}

export interface FetchFiatConnectQuotesCompletedAction {
  quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[]
}

export interface FetchFailedAction {
  error: string
}
export interface FetchFiatConnectProvidersCompletedAction {
  providers: FiatConnectProviderInfo[]
}

export type FiatAccountUsedAction = CachedFiatAccountUse
export interface CreateFiatConnectTransferAction {
  flow: CICOFlow
  fiatConnectQuote: FiatConnectQuote
  fiatAccountId: string
}

export interface CreateFiatConnectTransferFailedAction {
  flow: CICOFlow
  quoteId: string
}

export interface CreateFiatConnectTransferCompletedAction {
  flow: CICOFlow
  quoteId: string
  txHash: string | null
}

interface RefetchQuoteAction {
  flow: CICOFlow
  quote: FiatConnectQuote
  fiatAccount: ObfuscatedFiatAccountData
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
    fetchFiatConnectQuotesFailed: (state, action: PayloadAction<FetchFailedAction>) => {
      state.quotesLoading = false
      state.quotesError = action.payload.error
    },
    refetchQuote: (state, action: PayloadAction<RefetchQuoteAction>) => {
      state.quotesLoading = true
      state.quotesError = null
    },
    refetchQuoteCompleted: (state) => {
      state.quotesLoading = false
      state.quotesError = null
    },
    refetchQuoteFailed: (state, action: PayloadAction<{ error: string }>) => {
      state.quotesLoading = false
      state.quotesError = action.payload.error
    },
    fiatAccountUsed: (state, action: PayloadAction<FiatAccountUsedAction>) => {
      state.cachedFiatAccountUses = [
        action.payload,
        ...state.cachedFiatAccountUses.filter(
          (fiatAccount) => !isEqual(fiatAccount, action.payload)
        ),
      ]
    },
    attemptReturnUserFlow: (state, action: PayloadAction<AttemptReturnUserFlowAction>) => {
      state.attemptReturnUserFlowLoading = true
    },
    attemptReturnUserFlowCompleted: (state) => {
      state.attemptReturnUserFlowLoading = false
    },
    selectFiatConnectQuote: (state, action: PayloadAction<{ quote: FiatConnectQuote }>) => {
      state.selectFiatConnectQuoteLoading = true
    },
    selectFiatConnectQuoteCompleted: (state) => {
      state.selectFiatConnectQuoteLoading = false
    },
    createFiatConnectTransfer: (state, action: PayloadAction<CreateFiatConnectTransferAction>) => {
      state.transfer = {
        quoteId: action.payload.fiatConnectQuote.getQuoteId(),
        flow: action.payload.flow,
        isSending: true,
        failed: false,
        txHash: null,
      }
    },
    createFiatConnectTransferFailed: (
      state,
      action: PayloadAction<CreateFiatConnectTransferFailedAction>
    ) => {
      state.transfer = {
        quoteId: action.payload.quoteId,
        flow: action.payload.flow,
        isSending: false,
        failed: true,
        txHash: null,
      }
    },
    createFiatConnectTransferCompleted: (
      state,
      action: PayloadAction<CreateFiatConnectTransferCompletedAction>
    ) => {
      state.transfer = {
        quoteId: action.payload.quoteId,
        flow: action.payload.flow,
        isSending: false,
        failed: false,
        txHash: action.payload.txHash,
      }
    },
    fetchFiatConnectProviders: () => {
      // no state update
    },
    fetchFiatConnectProvidersCompleted: (
      state,
      action: PayloadAction<FetchFiatConnectProvidersCompletedAction>
    ) => {
      state.providers = action.payload.providers
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'fiatConnect'),
      quotesLoading: false,
      quotesError: null,
      transfer: null,
      attemptReturnUserFlowLoading: false,
      selectFiatConnectQuoteLoading: false,
    }))
  },
})

export const {
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  refetchQuote,
  refetchQuoteCompleted,
  refetchQuoteFailed,
  fiatAccountUsed,
  attemptReturnUserFlow,
  attemptReturnUserFlowCompleted,
  selectFiatConnectQuote,
  selectFiatConnectQuoteCompleted,
  createFiatConnectTransfer,
  createFiatConnectTransferFailed,
  createFiatConnectTransferCompleted,
  fetchFiatConnectProviders,
  fetchFiatConnectProvidersCompleted,
} = slice.actions

export default slice.reducer
