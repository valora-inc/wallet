import WalletConnectClient from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { SendOrigin } from 'src/analytics/types'
import { TokenTransactionType } from 'src/apollo/types'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TransactionDataInput } from 'src/send/SendAmount'
import { TransferConfirmationCardProps } from 'src/transactions/TransferConfirmationCard'

export enum Actions {
  CLIENT_INITIALISED = 'WALLETCONNECT/CLIENT_INITIALISED',
  SESSION_REQUEST = 'WALLETCONNECT/SESSION_REQUEST',

  SESSION_PROPOSAL = 'WALLETCONNECT/SESSION_PROPOSAL',
  SESSION_CREATED = 'WALLETCONNECT/SESSION_CREATED',
  SESSION_UPDATED = 'WALLETCONNECT/SESSION_UPDATED',
  SESSION_DELETED = 'WALLETCONNECT/SESSION_DELETED',
  SESSION_PAYLOAD = 'WALLETCONNECT/SESSION_PAYLOAD',

  PAIRING_PROPOSAL = 'WALLETCONNECT/PAIRING_PROPOSAL',
  PAIRING_CREATED = 'WALLETCONNECT/PAIRING_CREATED',
  PAIRING_UPDATED = 'WALLETCONNECT/PAIRING_UPDATED',
  PAIRING_DELETED = 'WALLETCONNECT/PAIRING_DELETED',
}

export interface ClientInitialised {
  type: Actions.CLIENT_INITIALISED
  client: WalletConnectClient
}

export interface SessionRequest {
  type: Actions.SESSION_REQUEST
  uri: string
}
export interface SessionProposal {
  type: Actions.SESSION_PROPOSAL
  session: SessionTypes.Proposal
}
export interface SessionCreated {
  type: Actions.SESSION_CREATED
  session: SessionTypes.Created
}
export interface SessionUpdated {
  type: Actions.SESSION_REQUEST
  session: SessionTypes.Update
}
export interface SessionDeleted {
  type: Actions.SESSION_DELETED
  session: SessionTypes.DeleteParams
}
export interface PairingProposal {
  type: Actions.PAIRING_PROPOSAL
  pairing: PairingTypes.Proposal
}
export interface PairingCreated {
  type: Actions.PAIRING_CREATED
  pairing: PairingTypes.Created
}
export interface PairingUpdated {
  type: Actions.PAIRING_UPDATED
  pairing: PairingTypes.Update
}
export interface PairingDeleted {
  type: Actions.PAIRING_DELETED
  pairing: PairingTypes.DeleteParams
}

export type ActionTypes = SessionRequest | ClientInitialised

export const newSessionRequest = (uri: string): SessionRequest => ({
  type: Actions.SESSION_REQUEST,
  uri,
})

export const sessionProposal = (session: SessionTypes.Proposal): SessionProposal => ({
  type: Actions.SESSION_PROPOSAL,
  session,
})
export const sessionCreated = (session: SessionTypes.Created) => ({
  type: Actions.SESSION_CREATED,
  session,
})
export const sessionUpdated = (session: SessionTypes.Update) => ({
  type: Actions.SESSION_REQUEST,
  session,
})
export const sessionDeleted = (session: SessionTypes.DeleteParams) => ({
  type: Actions.SESSION_DELETED,
  session,
})
export const sessionPayload = (payload: SessionTypes.PayloadEvent) => ({
  type: Actions.SESSION_PAYLOAD,
  payload,
})

export const pairingProposal = (pairing: PairingTypes.Proposal) => ({
  type: Actions.PAIRING_PROPOSAL,
  pairing,
})
export const pairingCreated = (pairing: PairingTypes.Created) => ({
  type: Actions.PAIRING_CREATED,
  pairing,
})
export const pairingUpdated = (pairing: PairingTypes.Update) => ({
  type: Actions.PAIRING_UPDATED,
  pairing,
})
export const pairingDeleted = (pairing: PairingTypes.DeleteParams) => ({
  type: Actions.PAIRING_DELETED,
  pairing,
})

export const navigateToPaymentTransferReview = (
  type: TokenTransactionType,
  timestamp: number,
  confirmationProps: TransferConfirmationCardProps
) => {
  navigate(Screens.TransactionReview, {
    reviewProps: {
      type,
      timestamp,
    },
    confirmationProps,
  })
}

export const navigateToExchangeReview = (
  timestamp: number,
  confirmationProps: ExchangeConfirmationCardProps
) => {
  navigate(Screens.TransactionReview, {
    reviewProps: {
      type: TokenTransactionType.Exchange,
      timestamp,
    },
    confirmationProps,
  })
}

export const navigateToRequestedPaymentReview = (transactionData: TransactionDataInput) => {
  navigate(Screens.SendConfirmation, { transactionData, origin: SendOrigin.AppRequestFlow })
}
