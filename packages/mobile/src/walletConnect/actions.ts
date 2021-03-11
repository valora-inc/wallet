import WalletConnectClient from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'

export enum Actions {
  CLIENT_INITIALISED = 'WALLETCONNECT/CLIENT_INITIALISED',

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

export interface SessionProposal {
  type: Actions.SESSION_PROPOSAL
  session: SessionTypes.Proposal
}
export interface SessionCreated {
  type: Actions.SESSION_CREATED
  session: SessionTypes.Created
}
export interface SessionUpdated {
  type: Actions.SESSION_UPDATED
  session: SessionTypes.Update
}
export interface SessionDeleted {
  type: Actions.SESSION_DELETED
  session: SessionTypes.DeleteParams
}
export interface SessionPayload {
  type: Actions.SESSION_PAYLOAD
  session: SessionTypes.Payload
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

export type ActionTypes =
  | ClientInitialised
  | SessionProposal
  | SessionCreated
  | SessionUpdated
  | SessionDeleted
  | SessionPayload
  | PairingProposal
  | PairingCreated
  | PairingUpdated
  | PairingDeleted

export const clientInitialised = (client: WalletConnectClient) => ({
  type: Actions.CLIENT_INITIALISED,
  client,
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
  type: Actions.SESSION_UPDATED,
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
