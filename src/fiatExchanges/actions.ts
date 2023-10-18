import { ProviderLogos } from 'src/fiatExchanges/reducer'

export enum Actions {
  BIDALI_PAYMENT_REQUESTED = 'FIAT_EXCHANGES/BIDALI_PAYMENT_REQUESTED',
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

export interface SetProviderLogos {
  type: Actions.SET_PROVIDER_LOGOS
  providerLogos: ProviderLogos
}

export const setProviderLogos = (providerLogos: ProviderLogos): SetProviderLogos => ({
  type: Actions.SET_PROVIDER_LOGOS,
  providerLogos,
})

export type ActionTypes = BidaliPaymentRequestedAction | SetProviderLogos
