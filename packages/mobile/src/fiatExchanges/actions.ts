import { ProviderLogos, TxHashToProvider } from 'src/fiatExchanges/reducer'

export enum Actions {
  BIDALI_PAYMENT_REQUESTED = 'FIAT_EXCHANGES/BIDALI_PAYMENT_REQUESTED',
  SELECT_PROVIDER = 'FIAT_EXCHANGES/SELECT_PROVIDER',
  ASSIGN_PROVIDER_TO_TX_HASH = 'FIAT_EXCHANGES/ASSIGN_PROVIDER_TO_TX_HASH',
  SET_PROVIDERS_FOR_TX_HASHES = 'SET_PROVIDERS_FOR_TX_HASHES',
  SET_PROVIDER_LOGOS = 'SET_PROVIDER_LOGOS',
}

export interface BidaliPaymentRequestedAction {
  type: Actions.BIDALI_PAYMENT_REQUESTED
  address: string
  amount: string
  currency: string
  description: string
  chargeId: string
  onPaymentSent: () => void
  onCancelled: () => void
}

export const bidaliPaymentRequested = (
  address: string,
  amount: string,
  currency: string,
  description: string,
  chargeId: string,
  onPaymentSent: () => void,
  onCancelled: () => void
): BidaliPaymentRequestedAction => ({
  type: Actions.BIDALI_PAYMENT_REQUESTED,
  address,
  amount,
  currency,
  description,
  chargeId,
  onPaymentSent,
  onCancelled,
})

export interface SelectProviderAction {
  type: Actions.SELECT_PROVIDER
  provider: string
}

export const selectProvider = (provider: string): SelectProviderAction => ({
  type: Actions.SELECT_PROVIDER,
  provider,
})

export interface AssignProviderToTxHashAction {
  type: Actions.ASSIGN_PROVIDER_TO_TX_HASH
  txHash: string
  currencyCode: string
}

export const assignProviderToTxHash = (
  txHash: string,
  currencyCode: string
): AssignProviderToTxHashAction => ({
  type: Actions.ASSIGN_PROVIDER_TO_TX_HASH,
  txHash,
  currencyCode,
})

export interface SetProvidersForTxHashesAction {
  type: Actions.SET_PROVIDERS_FOR_TX_HASHES
  txHashes: TxHashToProvider
}

export const setProvidersForTxHashes = (
  txHashes: TxHashToProvider
): SetProvidersForTxHashesAction => ({
  type: Actions.SET_PROVIDERS_FOR_TX_HASHES,
  txHashes,
})

export interface SetProviderLogos {
  type: Actions.SET_PROVIDER_LOGOS
  providerLogos: ProviderLogos
}

export const setProviderLogos = (providerLogos: ProviderLogos): SetProviderLogos => ({
  type: Actions.SET_PROVIDER_LOGOS,
  providerLogos,
})

export type ActionTypes =
  | BidaliPaymentRequestedAction
  | SelectProviderAction
  | AssignProviderToTxHashAction
  | SetProvidersForTxHashesAction
  | SetProviderLogos
