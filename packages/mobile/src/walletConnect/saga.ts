import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { SessionTypes } from '@walletconnect/types-v2'
import { call, put, select, take } from 'redux-saga/effects'
import { WalletConnectEvents } from 'src/analytics/Events'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { ShowRequestDetails } from 'src/walletConnect/actions'
import { initialiseConnection } from 'src/walletConnect/actions-v1'
import { Actions, initialiseClient, initialisePairing } from 'src/walletConnect/actions-v2'
import { PendingAction, PendingSession, Session } from 'src/walletConnect/reducer'
import {
  selectHasPendingState,
  selectPendingActions,
  selectSessions,
} from 'src/walletConnect/selectors'

export function getDefaultSessionTrackedProperties(
  session: SessionTypes.Proposal | SessionTypes.Created | SessionTypes.Settled
) {
  const peer = 'proposer' in session ? session.proposer : session.peer
  const { name: dappName, url: dappUrl, description: dappDescription, icons } = peer.metadata
  const {
    blockchain: { chains: permissionsBlockchains },
    jsonrpc: { methods: permissionsJsonrpcMethods },
    notifications: { types: permissionsNotificationsTypes },
  } = session.permissions
  const { protocol: relayProtocol } = session.relay
  return {
    dappName,
    dappUrl,
    dappDescription,
    dappIcon: icons[0],
    permissionsBlockchains,
    permissionsJsonrpcMethods,
    permissionsNotificationsTypes,
    relayProtocol,
  }
}

export function getDefaultRequestTrackedProperties(request: SessionTypes.RequestEvent) {
  const { id: requestId, jsonrpc: requestJsonrpc, method: requestMethod } = request.request
  return {
    requestChainId: request.chainId,
    requestId,
    requestJsonrpc,
    requestMethod,
  }
}

export function* getSessionFromRequest(request: SessionTypes.RequestEvent) {
  const { sessions }: { sessions: SessionTypes.Created[] } = yield select(selectSessions)
  const session = sessions.find((s) => s.topic === request.topic)
  if (!session) {
    // This should never happen
    throw new Error(`Unable to find WalletConnect session matching topic ${request.topic}`)
  }

  return session
}

export function* showRequestDetails({ request, infoString }: ShowRequestDetails): any {
  const session: SessionTypes.Created = yield call(getSessionFromRequest, request.action)
  ValoraAnalytics.track(WalletConnectEvents.wc_request_details, {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request.action),
  })

  // TODO: this is a short lived alternative to proper
  // transaction decoding.
  yield call(navigate, Screens.DappKitTxDataScreen, { dappKitData: infoString })
}

export function* showSessionRequest(pendingSession: PendingSession) {
  ValoraAnalytics.track(WalletConnectEvents.wc_session_propose, {
    ...getDefaultSessionTrackedProperties(pendingSession.session),
  })

  yield call(navigate, Screens.WalletConnectSessionRequest, pendingSession)
}

export function* showActionRequest(request: PendingAction) {
  const session: SessionTypes.Created = yield call(getSessionFromRequest, request.action)
  ValoraAnalytics.track(WalletConnectEvents.wc_request_propose, {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request.action),
  })

  yield call(navigate, Screens.WalletConnectActionRequest, request)
}

export function* handlePendingStateOrNavigateBack() {
  const hasPendingState: boolean = yield select(selectHasPendingState)
  if (hasPendingState) {
    yield call(handlePendingState)
  } else {
    navigateBack()
  }
}

export function* handlePendingState(): any {
  const {
    pending: [session],
  }: {
    pending: PendingSession[]
    sessions: Session[]
  } = yield select(selectSessions)

  if (session) {
    navigate(Screens.WalletConnectSessionRequest, session)
    return
  }

  const [request]: PendingAction[] = yield select(selectPendingActions)
  if (request) {
    yield call(showActionRequest, request.action)
  }
}

export function* checkPersistedState(): any {
  const {
    sessions,
  }: {
    pending: PendingSession[]
    sessions: Session[]
  } = yield select(selectSessions)
  if (sessions.find((s) => s.isV1)) {
    // todo: handle v1 sessions
  }

  if (sessions.find((s) => !s.isV1)) {
    yield put(initialiseClient())
    yield call(handlePendingState)
  }
}

export function* initialiseWalletConnect(uri: string, origin: WalletConnectPairingOrigin) {
  const [, , version] = uri.split(/:@?/)
  if (version === '1') {
    yield put(initialiseConnection(uri))
  } else {
    yield put(initialiseClient())
    yield take(Actions.CLIENT_INITIALISED)
    yield put(initialisePairing(uri, origin))
  }
}
