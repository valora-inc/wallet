import {
  FiatAccountSchema,
  FiatAccountType,
  FiatType,
  KycSchema,
  ObfuscatedFiatAccountData,
  QuoteResponse,
} from '@fiatconnect/fiatconnect-types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { isEqual } from 'lodash'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import {
  FiatConnectProviderInfo,
  FiatConnectQuoteError,
  FiatConnectQuoteSuccess,
} from 'src/fiatconnect'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { NetworkId } from 'src/transactions/types'
import { CiCoCurrency } from 'src/utils/currencies'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'

export enum SendingTransferStatus {
  Sending = 'Sending',
  Completed = 'Completed',
  Failed = 'Failed',
  TxProcessing = 'TxProcessing',
}

export interface FiatConnectTransfer {
  flow: CICOFlow
  quoteId: string
  status: SendingTransferStatus
  txHash: string | null // only for cash outs, the hash of the tx to send crypto to the provider
}

export enum SendingFiatAccountStatus {
  NotSending = 'NotSending',
  Sending = 'Sending',
  KycApproved = 'KycApproved',
}

export interface CachedQuoteParams {
  cryptoAmount: string
  fiatAmount: string
  flow: CICOFlow
  cryptoType: CiCoCurrency
  fiatType: FiatType
}

export interface CachedTransferDetails {
  txHash: string
  transferId: string
  providerId: string
  fiatAccountId: string
  quote: QuoteResponse['quote']
}

export interface State {
  quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[]
  quotesLoading: boolean
  quotesError: string | null
  transfer: FiatConnectTransfer | null
  cachedTransfers: { [txHash: string]: CachedTransferDetails }
  providers: FiatConnectProviderInfo[] | null
  cachedFiatAccountUses: CachedFiatAccountUse[]
  attemptReturnUserFlowLoading: boolean
  selectFiatConnectQuoteLoading: boolean
  sendingFiatAccountStatus: SendingFiatAccountStatus
  kycTryAgainLoading: boolean
  cachedQuoteParams: {
    [providerId: string]: {
      [kycSchema: string]: CachedQuoteParams
    }
  }
  schemaCountryOverrides: FiatAccountSchemaCountryOverrides
  personaInProgress: boolean
}

export const initialState: State = {
  quotes: [],
  quotesLoading: false,
  quotesError: null,
  transfer: null,
  cachedTransfers: {},
  providers: null,
  cachedFiatAccountUses: [],
  attemptReturnUserFlowLoading: false,
  selectFiatConnectQuoteLoading: false,
  sendingFiatAccountStatus: SendingFiatAccountStatus.NotSending,
  kycTryAgainLoading: false,
  cachedQuoteParams: {},
  schemaCountryOverrides: {},
  personaInProgress: false,
}

export type FiatAccount = ObfuscatedFiatAccountData & {
  providerId: string
}

export interface CachedFiatAccountUse {
  fiatAccountId: string
  providerId: string
  flow: string
  cryptoType: CiCoCurrency
  fiatType: FiatType
  fiatAccountType: FiatAccountType
  fiatAccountSchema: FiatAccountSchema
}

export interface FetchQuotesAction {
  flow: CICOFlow
  digitalAsset: string
  cryptoAmount: number
  fiatAmount: number
  providerIds?: string[]
}

export interface AttemptReturnUserFlowAction {
  flow: CICOFlow
  selectedCrypto: string
  amount: {
    crypto: number
    fiat: number
  }
  providerId: string
  fiatAccountId: string
  fiatAccountType: FiatAccountType
  fiatAccountSchema: FiatAccountSchema
  tokenId: string
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
  serializablePreparedTransaction?: SerializableTransactionRequest
  networkId?: NetworkId
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

export type CacheFiatConnectTransferAction = CachedTransferDetails

export interface CreateFiatConnectTransferTxProcessingAction {
  flow: CICOFlow
  quoteId: string
}

interface RefetchQuoteAction {
  flow: CICOFlow
  cryptoType: string
  cryptoAmount: string
  fiatAmount: string
  providerId: string
  fiatAccount?: FiatAccount
  tokenId: string
}

interface SubmitFiatAccountAction {
  flow: CICOFlow
  quote: FiatConnectQuote
  fiatAccountData: Record<string, any>
}

interface KycTryAgainAction {
  flow: CICOFlow
  quote: FiatConnectQuote
}

interface CacheQuoteParamsAction {
  providerId: string
  kycSchema: KycSchema
  cachedQuoteParams: CachedQuoteParams
}

export const slice = createSlice({
  name: 'fiatConnect',
  initialState,
  reducers: {
    cacheQuoteParams: (state, action: PayloadAction<CacheQuoteParamsAction>) => {
      if (!state.cachedQuoteParams[action.payload.providerId]) {
        state.cachedQuoteParams[action.payload.providerId] = {}
      }
      state.cachedQuoteParams[action.payload.providerId][action.payload.kycSchema] =
        action.payload.cachedQuoteParams
    },
    submitFiatAccount: (state, action: PayloadAction<SubmitFiatAccountAction>) => {
      state.sendingFiatAccountStatus = SendingFiatAccountStatus.Sending
    },
    submitFiatAccountKycApproved: (state) => {
      state.sendingFiatAccountStatus = SendingFiatAccountStatus.KycApproved
    },
    submitFiatAccountCompleted: (state) => {
      state.sendingFiatAccountStatus = SendingFiatAccountStatus.NotSending
    },
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
        txHash: null,
        status: SendingTransferStatus.Sending,
      }
    },
    createFiatConnectTransferFailed: (
      state,
      action: PayloadAction<CreateFiatConnectTransferFailedAction>
    ) => {
      state.transfer = {
        quoteId: action.payload.quoteId,
        flow: action.payload.flow,
        txHash: null,
        status: SendingTransferStatus.Failed,
      }
    },
    createFiatConnectTransferCompleted: (
      state,
      action: PayloadAction<CreateFiatConnectTransferCompletedAction>
    ) => {
      state.transfer = {
        quoteId: action.payload.quoteId,
        flow: action.payload.flow,
        txHash: action.payload.txHash,
        status: SendingTransferStatus.Completed,
      }
    },
    createFiatConnectTransferTxProcessing: (
      state,
      action: PayloadAction<CreateFiatConnectTransferTxProcessingAction>
    ) => {
      state.transfer = {
        quoteId: action.payload.quoteId,
        flow: action.payload.flow,
        txHash: null,
        status: SendingTransferStatus.TxProcessing,
      }
    },
    cacheFiatConnectTransfer: (state, action: PayloadAction<CacheFiatConnectTransferAction>) => {
      const transferDetails: CachedTransferDetails = {
        txHash: action.payload.txHash,
        transferId: action.payload.transferId,
        providerId: action.payload.providerId,
        fiatAccountId: action.payload.fiatAccountId,
        quote: action.payload.quote,
      }
      state.cachedTransfers[action.payload.txHash] = transferDetails
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
    fetchFiatConnectProvidersFailed: () => {
      // no state update
    },
    kycTryAgain: (state, action: PayloadAction<KycTryAgainAction>) => {
      state.kycTryAgainLoading = true
    },
    kycTryAgainCompleted: (state) => {
      state.kycTryAgainLoading = false
    },
    personaStarted: (state) => {
      state.personaInProgress = true
    },
    postKyc: (_state, action: PayloadAction<{ quote: FiatConnectQuote }>) => {
      // no state update
    },
    personaFinished: (state) => {
      state.personaInProgress = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        AppActions.UPDATE_REMOTE_CONFIG_VALUES,
        (state, action: UpdateConfigValuesAction) => {
          state.schemaCountryOverrides = action.configValues.fiatAccountSchemaCountryOverrides
        }
      )
      .addCase(REHYDRATE, (state, action: RehydrateAction) => ({
        ...state,
        ...getRehydratePayload(action, 'fiatConnect'),
        quotes: [], // reset quotes since we want to always re-fetch a new set of quotes
        quotesLoading: false,
        quotesError: null,
        transfer: null,
        attemptReturnUserFlowLoading: false,
        selectFiatConnectQuoteLoading: false,
        sendingFiatAccountStatus: SendingFiatAccountStatus.NotSending,
        kycTryAgainLoading: false,
        personaInProgress: false,
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
  createFiatConnectTransferTxProcessing,
  cacheFiatConnectTransfer,
  fetchFiatConnectProviders,
  fetchFiatConnectProvidersCompleted,
  fetchFiatConnectProvidersFailed,
  submitFiatAccount,
  submitFiatAccountKycApproved,
  submitFiatAccountCompleted,
  kycTryAgain,
  kycTryAgainCompleted,
  cacheQuoteParams,
  personaStarted,
  personaFinished,
  postKyc,
} = slice.actions

export default slice.reducer
