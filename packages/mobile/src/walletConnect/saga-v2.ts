import { appendPath } from '@celo/base'
import AsyncStorage from '@react-native-community/async-storage'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client-v2'
import { SessionTypes } from '@walletconnect/types-v2'
import { ERROR as WalletConnectErrors } from '@walletconnect/utils-v2'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { WalletConnectEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  clientInitialised,
  CloseSession,
  DenyRequest,
  DenySession,
  initialiseClient,
  InitialisePairing,
  sessionCreated,
  sessionDeleted,
  SessionPayload,
  sessionPayload,
  SessionProposal,
  sessionProposal,
  sessionUpdated,
  WalletConnectActions,
} from 'src/walletConnect/actions-v2'
import { PendingAction, PendingSession, Session } from 'src/walletConnect/reducer'
import { handleRequest } from 'src/walletConnect/request'
import {
  getDefaultRequestTrackedProperties,
  getDefaultSessionTrackedProperties,
  getSessionFromRequest,
  handlePendingState,
  handlePendingStateOrNavigateBack,
} from 'src/walletConnect/saga'
import { selectPendingActions, selectSessions } from 'src/walletConnect/selectors'
import { getAccountAddress } from 'src/web3/saga'

const TAG = 'WalletConnect/saga'

let client: WalletConnectClient | null = null

export function* acceptSession({ session }: AcceptSession) {
  const defaultTrackedProperties = getDefaultSessionTrackedProperties(session)

  try {
    if (!client) {
      throw new Error('missing client')
    }
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_start, defaultTrackedProperties)

    const account: string = yield call(getAccountAddress)
    const response: SessionTypes.Response = {
      metadata: {
        name: APP_NAME,
        description: i18n.t('global:appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
      },
      state: {
        // just covering the range of possibly accepted
        // addresses in CAIP formats
        accounts: [
          // short name mapping https://github.com/ethereum-lists/chains/issues/359
          `celo:${account}`,
          // CAIP 50 https://github.com/ChainAgnostic/CAIPs/pull/50
          `${account}@celo:${networkConfig.networkId}`,
          `${account}@eip155:${networkConfig.networkId}`,
          // CAIP 10 https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md
          `celo:${networkConfig.networkId}:${account}`,
          `eip155:${networkConfig.networkId}:${account}`,
        ],
      },
    }

    yield call(client.approve.bind(client), { proposal: session, response })
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_success, {
      ...defaultTrackedProperties,
    })
  } catch (e) {
    Logger.debug(TAG + '@acceptSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingState)
}

export function* denySession({ session }: DenySession) {
  const defautTrackedProperties = getDefaultSessionTrackedProperties(session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_start, {
      ...defautTrackedProperties,
    })

    if (!client) {
      throw new Error('missing client')
    }

    yield call(client.reject.bind(client), {
      reason: WalletConnectErrors.NOT_APPROVED.format(),
      proposal: session,
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_success, {
      ...defautTrackedProperties,
    })
  } catch (e) {
    Logger.debug(TAG + '@denySession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingState)
}

export function* closeSession({ session }: CloseSession) {
  const defautTrackedProperties = getDefaultSessionTrackedProperties(session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_start, {
      ...defautTrackedProperties,
    })
    if (!client) {
      throw new Error('missing client')
    }

    yield call(client.disconnect.bind(client), {
      topic: session.topic,
      reason: WalletConnectErrors.USER_DISCONNECTED.format(),
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_success, {
      ...defautTrackedProperties,
    })
  } catch (e) {
    Logger.debug(TAG + '@closeSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }
}

export function* acceptRequest({ request }: AcceptRequest): any {
  const {
    request: { id, jsonrpc, method, params },
    topic,
  } = request

  const session: SessionTypes.Created = yield call(getSessionFromRequest, request)
  const defautTrackedProperties = {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request),
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_start, {
      ...defautTrackedProperties,
    })

    if (!client) {
      throw new Error('Missing client')
    }
    const result = yield call(handleRequest, { method, params })
    yield call(client.respond.bind(client), {
      topic,
      response: {
        id,
        jsonrpc,
        result,
      },
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_success, {
      ...defautTrackedProperties,
    })
  } catch (e) {
    if (client) {
      yield call(client.respond.bind(client), {
        topic,
        response: {
          id,
          jsonrpc,
          error: e.message,
        },
      })
    }
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

export function* denyRequest({ request }: DenyRequest) {
  const {
    request: { id, jsonrpc },
    topic,
  } = request

  const session: SessionTypes.Created = yield call(getSessionFromRequest, request)
  const defautTrackedProperties = {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request),
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_start, {
      ...defautTrackedProperties,
    })

    if (!client) {
      throw new Error('Missing client')
    }

    yield call(client.respond.bind(client), {
      topic,
      response: {
        id,
        jsonrpc,
        error: WalletConnectErrors.DISAPPROVED_JSONRPC.format(),
      },
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_success, {
      ...defautTrackedProperties,
    })
  } catch (e) {
    Logger.debug(TAG + '@denyRequest', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

export function* handleInitialiseWalletConnect() {
  const walletConnectChannel: EventChannel<WalletConnectActions> = yield call(
    createWalletConnectChannel
  )
  while (true) {
    const message: WalletConnectActions = yield take(walletConnectChannel)
    yield put(message)
  }
}

export function* createWalletConnectChannel() {
  if (!client) {
    Logger.debug(TAG + '@createWalletConnectChannel', `init start`)
    client = yield call(WalletConnectClient.init as any, {
      relayProvider: networkConfig.walletConnectEndpoint,
      storageOptions: {
        asyncStorage: AsyncStorage,
      },
      logger: 'error',
      controller: true,
    })
    Logger.debug(TAG + '@createWalletConnectChannel', `init end`)
  }
  yield put(clientInitialised())

  return eventChannel((emit: any) => {
    const onSessionProposal = (session: SessionTypes.Proposal) => emit(sessionProposal(session))
    const onSessionCreated = (session: SessionTypes.Created) => emit(sessionCreated(session))
    const onSessionUpdated = (session: SessionTypes.UpdateParams) => emit(sessionUpdated(session))
    const onSessionDeleted = (session: SessionTypes.DeleteParams) => emit(sessionDeleted(session))
    const onSessionRequest = (request: SessionTypes.RequestEvent) => emit(sessionPayload(request))

    if (!client) {
      return () => {
        Logger.debug(TAG + '@createWalletConnectChannel', 'missing client clean up')
      }
    }

    client.on(CLIENT_EVENTS.session.proposal, onSessionProposal)
    client.on(CLIENT_EVENTS.session.created, onSessionCreated)
    client.on(CLIENT_EVENTS.session.updated, onSessionUpdated)
    client.on(CLIENT_EVENTS.session.deleted, onSessionDeleted)
    client.on(CLIENT_EVENTS.session.request, onSessionRequest)

    return () => {
      if (!client) {
        Logger.debug(TAG + '@createWalletConnectChannel', 'clean up but missing client')
        return
      }

      Logger.debug(TAG + '@createWalletConnectChannel', 'clean up')

      client.off(CLIENT_EVENTS.session.proposal, onSessionProposal)
      client.off(CLIENT_EVENTS.session.created, onSessionCreated)
      client.off(CLIENT_EVENTS.session.updated, onSessionUpdated)
      client.off(CLIENT_EVENTS.session.deleted, onSessionDeleted)
      client.off(CLIENT_EVENTS.session.request, onSessionRequest)

      const reason = WalletConnectErrors.EXPIRED.format()
      client.session.topics.map((topic) => client!.disconnect({ reason, topic }))
      client = null
    }
  })
}

/**
 * When handling incoming requests (actions or sessions) we need to handle
 * them in order. That means if a request comes in, and we already have a
 * pending one, ignore it. Once a request is dealt with we handle the new
 * requests accordingly.
 */

export function* handleIncomingSessionRequest({ session }: SessionProposal) {
  const { pending }: { pending: PendingSession[] } = yield select(selectSessions)
  if (pending.length > 1) {
    return
  }

  navigate(Screens.WalletConnectSessionRequest, { isV1: false, session })
}
export function* handleIncomingActionRequest({ request }: SessionPayload) {
  const pendingActions: PendingAction[] = yield select(selectPendingActions)
  if (pendingActions.length > 1) {
    return
  }

  navigate(Screens.WalletConnectActionRequest, { isV1: false, action: request })
}

export function* handleInitialisePairing({ uri, origin }: InitialisePairing) {
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_start, {
      origin,
    })
    if (!client) {
      throw new Error('missing client')
    }

    Logger.debug(TAG + '@handleInitialisePairing', 'pair start')
    yield call(client.pair.bind(client), { uri })
    Logger.debug(TAG + '@handleInitialisePairing', 'pair end')
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_success)
  } catch (e) {
    Logger.debug(TAG + '@handleInitialisePairing', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_error, { error: e.message })
  }
}

export function* checkPersistedState(): any {
  const {
    sessions,
  }: {
    pending: PendingSession[]
    sessions: Session[]
  } = yield select(selectSessions)

  if (sessions.find((s) => !s.isV1)) {
    yield put(initialiseClient())
  }

  yield call(handlePendingState)
}

export function* walletConnectV2Saga() {
  yield takeLeading(Actions.INITIALISE_CLIENT, handleInitialiseWalletConnect)
  yield takeEvery(Actions.INITIALISE_PAIRING, handleInitialisePairing)

  yield takeEvery(Actions.ACCEPT_SESSION, acceptSession)
  yield takeEvery(Actions.DENY_SESSION, denySession)
  yield takeEvery(Actions.CLOSE_SESSION, closeSession)
  yield takeEvery(Actions.ACCEPT_REQUEST, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST, denyRequest)

  yield takeEvery(Actions.SESSION_PROPOSAL, handleIncomingSessionRequest)
  yield takeEvery(Actions.SESSION_PAYLOAD, handleIncomingActionRequest)

  yield call(checkPersistedState)
}
