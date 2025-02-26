import { WalletConnectPairingOrigin } from 'src/analytics/types'
import {
  acceptRequest,
  acceptSession,
  Actions,
  clientDestroyed,
  clientInitialised,
  closeSession,
  denyRequest,
  denySession,
  initialiseClient,
  initialisePairing,
  removeExpiredSessions,
  sessionCreated,
  sessionDeleted,
  sessionPayload,
  sessionProposal,
  showRequestDetails,
} from './actions'

const mockSession = {} as any
const mockSessionProposal = {} as any
const mockSessionDelete = {} as any
const mockSessionRequest = {} as any
const mockError = {} as any
const mockNamespaces = {} as any
const mockPreparedTransaction = {} as any

describe('WalletConnect actions', () => {
  it('should create initialiseClient action', () => {
    expect(initialiseClient().type).toEqual(Actions.INITIALISE_CLIENT)
  })

  it('should create initialisePairing action', () => {
    const uri = 'wc:test'
    const origin = WalletConnectPairingOrigin.Deeplink
    expect(initialisePairing(uri, origin).type).toEqual(Actions.INITIALISE_PAIRING)
  })

  it('should create acceptSession action', () => {
    expect(acceptSession(mockSessionProposal, mockNamespaces).type).toEqual(Actions.ACCEPT_SESSION)
  })

  it('should create denySession action', () => {
    expect(denySession(mockSessionProposal, mockError).type).toEqual(Actions.DENY_SESSION)
  })

  it('should create closeSession action', () => {
    expect(closeSession(mockSession).type).toEqual(Actions.CLOSE_SESSION)
  })

  it('should create showRequestDetails action', () => {
    const infoString = 'Test info string'
    expect(showRequestDetails(mockSessionRequest, infoString).type).toEqual(
      Actions.SHOW_REQUEST_DETAILS
    )
  })

  it('should create acceptRequest action', () => {
    expect(acceptRequest(mockSessionRequest, mockPreparedTransaction).type).toEqual(
      Actions.ACCEPT_REQUEST
    )
  })

  it('should create denyRequest action', () => {
    expect(denyRequest(mockSessionRequest, mockError).type).toEqual(Actions.DENY_REQUEST)
  })

  it('should create removeExpiredSessions action', () => {
    const dateInSeconds = 1635847712
    expect(removeExpiredSessions(dateInSeconds).type).toEqual(Actions.REMOVE_EXPIRED_SESSIONS)
  })

  it('should create clientInitialised action', () => {
    expect(clientInitialised().type).toEqual(Actions.CLIENT_INITIALISED)
  })

  it('should create clientDestroyed action', () => {
    expect(clientDestroyed().type).toEqual(Actions.CLIENT_DESTROYED)
  })

  it('should create sessionProposal action', () => {
    expect(sessionProposal(mockSessionProposal).type).toEqual(Actions.SESSION_PROPOSAL)
  })

  it('should create sessionCreated action', () => {
    expect(sessionCreated(mockSession).type).toEqual(Actions.SESSION_CREATED)
  })

  it('should create sessionDeleted action', () => {
    expect(sessionDeleted(mockSessionDelete).type).toEqual(Actions.SESSION_DELETED)
  })

  it('should create sessionPayload action', () => {
    expect(sessionPayload(mockSessionRequest).type).toEqual(Actions.SESSION_PAYLOAD)
  })
})
