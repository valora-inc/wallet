import { ObfuscatedFiatAccountData } from '@fiatconnect/fiatconnect-types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  FiatConnectProviderInfo,
  FiatConnectQuoteError,
  FiatConnectQuoteSuccess,
} from 'src/fiatconnect'
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
  fiatAccounts: FiatAccount[]
  fiatAccountsLoading: boolean
  fiatAccountsError: string | null
  cachedFiatAccounts: FiatAccount[] | null
  transfer: FiatConnectTransfer | null
  providers: FiatConnectProviderInfo[] | null
  providersLoading: boolean
}

const initialState: State = {
  quotes: [],
  quotesLoading: false,
  quotesError: null,
  fiatAccounts: [],
  fiatAccountsLoading: false,
  fiatAccountsError: null,
  cachedFiatAccounts: null,
  transfer: null,
  providers: null,
  providersLoading: false,
}

export type FiatAccount = ObfuscatedFiatAccountData & {
  providerId: string
  supportedFlows: CICOFlow[]
}

export interface FetchQuotesAction {
  flow: CICOFlow
  digitalAsset: CiCoCurrency
  cryptoAmount: number
  providerIds?: string[]
}

export type FetchFiatAccountsAction = {
  providerId: string
  baseUrl: string
}

export interface FetchFiatAccountsCompletedAction {
  fiatAccounts: FiatAccount[]
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

export type FiatAccountAddedAction = FiatAccount
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
      const existingAccount = state.cachedFiatAccounts?.find(
        (fiatAccount) =>
          fiatAccount.providerId !== action.payload.providerId &&
          fiatAccount.fiatAccountId !== action.payload.fiatAccountId
      )
      state.cachedFiatAccounts = [
        {
          ...action.payload,
          ...(existingAccount?.supportedFlows.length && {
            supportedFlows: action.payload.supportedFlows.concat(existingAccount.supportedFlows),
          }),
        },
        ...(state.cachedFiatAccounts ?? []).filter(
          (fiatAccount) =>
            fiatAccount.providerId !== action.payload.providerId &&
            fiatAccount.fiatAccountId !== action.payload.fiatAccountId
        ),
      ]
    },
    fetchFiatAccounts: (state, action: PayloadAction<FetchFiatAccountsAction>) => {
      state.fiatAccountsLoading = true
      state.fiatAccountsError = null
    },
    fetchFiatAccountsCompleted: (
      state,
      action: PayloadAction<FetchFiatAccountsCompletedAction>
    ) => {
      state.fiatAccountsLoading = false
      state.fiatAccountsError = null
      state.fiatAccounts = action.payload.fiatAccounts
    },
    fetchFiatAccountsFailed: (state, action: PayloadAction<FetchFailedAction>) => {
      state.fiatAccountsLoading = false
      state.fiatAccountsError = action.payload.error
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
    fetchFiatConnectProviders: (state) => {
      state.providersLoading = true
    },
    fetchFiatConnectProvidersFailed: (state) => {
      state.providersLoading = false
    },
    fetchFiatConnectProvidersCompleted: (
      state,
      action: PayloadAction<FetchFiatConnectProvidersCompletedAction>
    ) => {
      state.providers = action.payload.providers
      state.providersLoading = false
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'fiatConnect'),
      quotesLoading: false,
      quotesError: null,
      transfer: null,
    }))
  },
})

export const {
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  fiatAccountUsed,
  fetchFiatAccounts,
  fetchFiatAccountsCompleted,
  fetchFiatAccountsFailed,
  createFiatConnectTransfer,
  createFiatConnectTransferFailed,
  createFiatConnectTransferCompleted,
  fetchFiatConnectProviders,
  fetchFiatConnectProvidersFailed,
  fetchFiatConnectProvidersCompleted,
} = slice.actions

export default slice.reducer
