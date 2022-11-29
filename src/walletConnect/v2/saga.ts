import { appendPath } from '@celo/utils/lib/string'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import SignClient from '@walletconnect/sign-client'
import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import { WALLET_CONNECT_PROJECT_ID } from 'src/config'
import i18n from 'src/i18n'
import { isBottomSheetVisible, navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { showWalletConnectionSuccessMessage } from 'src/walletConnect/saga'
import { WalletConnectRequestType } from 'src/walletConnect/types'
import {
  AcceptSession,
  Actions,
  clientInitialised,
  DenySession,
  initialiseClient,
  InitialisePairing,
  initialisePairing,
  sessionCreated,
  sessionDeleted,
  sessionPayload,
  SessionProposal,
  sessionProposal,
  sessionUpdated,
  WalletConnectActions,
} from 'src/walletConnect/v2/actions'
import { selectHasPendingState, selectSessions } from 'src/walletConnect/v2/selectors'
import networkConfig from 'src/web3/networkConfig'
import { getWalletAddress } from 'src/web3/saga'

let client: SignClient | null = null

const TAG = 'WalletConnect/saga'

function* handleInitialiseWalletConnect() {
  const walletConnectChannel: EventChannel<WalletConnectActions> = yield call(
    createWalletConnectChannel
  )
  while (true) {
    const message: WalletConnectActions = yield take(walletConnectChannel)
    yield put(message)
  }
}

function* createWalletConnectChannel() {
  if (!client) {
    Logger.debug(TAG + '@createWalletConnectChannel', `init start`)

    client = yield call([SignClient, 'init'], {
      logger: 'debug',
      projectId: WALLET_CONNECT_PROJECT_ID,
      relayUrl: networkConfig.walletConnectEndpoint,
      metadata: {
        name: APP_NAME,
        description: i18n.t('appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
      },
    })

    Logger.debug(TAG + '@createWalletConnectChannel', `init end`)
    yield put(clientInitialised())
  }

  return eventChannel((emit: any) => {
    const onSessionProposal = (session: SignClientTypes.EventArguments['session_proposal']) => {
      emit(sessionProposal(session))
    }

    const onSessionCreated = (sessionEvent: SignClientTypes.EventArguments['session_event']) => {
      const { topic } = sessionEvent
      const session = client!.session.get(topic)
      emit(sessionCreated(session))
    }
    const onSessionUpdated = (session: SignClientTypes.EventArguments['session_update']) => {
      emit(sessionUpdated(session))
    }
    const onSessionDeleted = (session: SignClientTypes.EventArguments['session_delete']) => {
      emit(sessionDeleted(session))
    }
    const onSessionRequest = (request: SignClientTypes.EventArguments['session_request']) => {
      emit(sessionPayload(request))
    }

    if (!client) {
      return () => {
        Logger.debug(TAG + '@createWalletConnectChannel', 'missing client clean up')
      }
    }

    client.on('session_proposal', onSessionProposal)
    client.on('session_event', onSessionCreated)
    client.on('session_update', onSessionUpdated)
    client.on('session_delete', onSessionDeleted)
    client.on('session_request', onSessionRequest)

    return async () => {
      if (!client) {
        Logger.debug(TAG + '@createWalletConnectChannel', 'clean up but missing client')
        return
      }

      Logger.debug(TAG + '@createWalletConnectChannel', 'clean up')

      client.off('session_proposal', onSessionProposal)
      client.off('session_event', onSessionCreated)
      client.off('session_update', onSessionUpdated)
      client.off('session_delete', onSessionDeleted)
      client.off('session_request', onSessionRequest)

      const connections = client.pairing.values
      await Promise.all(
        connections.map((connection) =>
          client!.disconnect({ topic: connection.topic, reason: getSdkError('USER_DISCONNECTED') })
        )
      )

      client = null
    }
  })
}

function* handleInitialisePairing({ uri, origin }: InitialisePairing) {
  // TODO analytics
  try {
    if (!client) {
      throw new Error('missing client')
    }

    Logger.debug(TAG + '@handleInitialisePairing', 'pair start')
    yield call([client, 'pair'], { uri })
    Logger.debug(TAG + '@handleInitialisePairing', 'pair end')
  } catch (e) {
    Logger.debug(TAG + '@handleInitialisePairing', e.message)
  }
}

/**
 * When handling incoming requests (actions or sessions) we need to handle
 * them in order. That means if a request comes in, and we already have a
 * pending one, ignore it. Once a request is dealt with we handle the new
 * requests accordingly.
 */

function* handleIncomingSessionRequest({ session }: SessionProposal) {
  const { pending }: { pending: SignClientTypes.EventArguments['session_proposal'][] } =
    yield select(selectSessions)
  if (pending.length > 1) {
    return
  }

  yield call(showSessionRequest, session)
}

function* showSessionRequest(session: SignClientTypes.EventArguments['session_proposal']) {
  // TODO analytics

  yield call(navigate, Screens.WalletConnectRequest, {
    type: WalletConnectRequestType.Session,
    pendingSession: session,
    version: 2,
  })
}

function* acceptSession({ session }: AcceptSession) {
  // TODO analytics
  try {
    if (!client) {
      throw new Error('missing client')
    }

    const address: string = yield call(getWalletAddress)
    const { requiredNamespaces, relays, proposer } = session.params
    const namespaces: SessionTypes.Namespaces = {}
    Object.keys(requiredNamespaces).forEach((key) => {
      const accounts: string[] = []
      requiredNamespaces[key].chains.map((chain) => {
        accounts.push(`${chain}:${address}`)
      })
      namespaces[key] = {
        accounts,
        methods: requiredNamespaces[key].methods,
        events: requiredNamespaces[key].events,
      }
    })

    const { acknowledged } = yield call([client, 'approve'], {
      id: session.id,
      relayProtocol: relays[0].protocol,
      namespaces,
    })

    yield call(acknowledged)

    yield call(showWalletConnectionSuccessMessage, proposer.metadata.name)
  } catch (e) {
    Logger.debug(TAG + '@acceptSession', e.message)
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* denySession({ session }: DenySession) {
  // TODO analytics
  try {
    if (!client) {
      throw new Error('missing client')
    }

    yield call([client, 'reject'], {
      id: session.id,
      reason: getSdkError('USER_REJECTED_METHODS'),
    })
  } catch (e) {
    Logger.debug(TAG + '@denySession', e.message)
  }

  yield call(handlePendingStateOrNavigateBack)
}

function* handlePendingStateOrNavigateBack() {
  const hasPendingState: boolean = yield select(selectHasPendingState)

  if (hasPendingState) {
    // yield call(handlePendingState)
  } else if (yield call(isBottomSheetVisible, Screens.WalletConnectRequest)) {
    navigateBack()
  }
}

export function* walletConnectV2Saga() {
  yield takeLeading(Actions.INITIALISE_CLIENT_V2, handleInitialiseWalletConnect)
  yield takeEvery(Actions.INITIALISE_PAIRING_V2, handleInitialisePairing)

  yield takeEvery(Actions.SESSION_PROPOSAL_V2, handleIncomingSessionRequest)
  yield takeEvery(Actions.ACCEPT_SESSION_V2, acceptSession)
  yield takeEvery(Actions.DENY_SESSION_V2, denySession)
}

export function* initialiseWalletConnectV2(uri: string, origin: WalletConnectPairingOrigin) {
  if (!client) {
    yield put(initialiseClient())
    yield take(Actions.CLIENT_INITIALISED_V2)
  }
  yield put(initialisePairing(uri, origin))
}
