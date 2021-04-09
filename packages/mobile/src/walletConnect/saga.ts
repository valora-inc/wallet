import { appendPath } from '@celo/base'
import { EncodedTransaction } from '@celo/connect'
import { UnlockableWallet } from '@celo/wallet-base'
import AsyncStorage from '@react-native-community/async-storage'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { ERROR as WalletConnectErrors, getError } from '@walletconnect/utils'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import { NETWORK_ID, WALLETCONNECT_URL } from 'src/config'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
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
  initialiseClient as initialiseClientAction,
  InitialisePairing,
  initialisePairing as initialisePairingAction,
  pairingCreated,
  pairingDeleted,
  pairingProposal,
  pairingUpdated,
  sessionCreated,
  sessionDeleted,
  SessionPayload,
  sessionPayload,
  SessionProposal,
  sessionProposal,
  sessionUpdated,
  WalletConnectActions,
} from 'src/walletConnect/actions'
import { SupportedActions } from 'src/walletConnect/constants'
import { selectPendingActions, selectSessions } from 'src/walletConnect/selectors'
import { getWallet } from 'src/web3/contracts'
import { getAccountAddress, unlockAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'WalletConnect/saga'

let client: WalletConnectClient | null = null

export function* acceptSession({ session }: AcceptSession) {
  try {
    if (!client) {
      throw new Error('missing client')
    }

    const account: string = yield call(getAccountAddress)
    const response: SessionTypes.Response = {
      metadata: {
        name: APP_NAME,
        description: 'A mobile payments wallet that works worldwide',
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
      },
      state: {
        accounts: [`${account}@celo:${NETWORK_ID}`],
      },
    }

    yield call(client.approve.bind(client), { proposal: session, response })
  } catch (e) {
    Logger.debug(TAG + '@acceptSession', e.message)
  }
}

export function* denySession({ session }: DenySession) {
  try {
    if (!client) {
      throw new Error('missing client')
    }
    yield call(client.reject.bind(client), {
      reason: getError(WalletConnectErrors.NOT_APPROVED),
      proposal: session,
    })
  } catch (e) {
    Logger.debug(TAG + '@denySession', e.message)
  }
}

export function* closeSession({ session }: CloseSession) {
  try {
    if (!client) {
      throw new Error('missing client')
    }
    yield call(client.disconnect.bind(client), {
      topic: session.topic,
      reason: getError(WalletConnectErrors.USER_DISCONNECTED),
    })
  } catch (e) {
    Logger.debug(TAG + '@closeSession', e.message)
  }
}

export function* acceptRequest({
  request: {
    request: { id, jsonrpc, method, params },
    topic,
  },
}: AcceptRequest): any {
  try {
    if (!client) {
      throw new Error('Missing client')
    }

    const account: string = yield select(currentAccountSelector)
    const wallet: UnlockableWallet = yield call(getWallet)

    let result: any

    if (method === SupportedActions.eth_signTransaction) {
      yield call(unlockAccount, account)
      result = (yield call(wallet.signTransaction.bind(wallet), params)) as EncodedTransaction
    } else {
      throw new Error('Unsupported action')
    }

    yield call(client.respond.bind(client), {
      topic,
      response: {
        id,
        jsonrpc,
        result,
      },
    })
  } catch (e) {
    Logger.debug(TAG + '@acceptRequest', e.message)
  }

  const [, nextRequest] = yield select(selectPendingActions)
  if (nextRequest) {
    navigate(Screens.WalletConnectActionRequest, { request: nextRequest })
    return
  }

  navigateBack()
}

export function* denyRequest({
  request: {
    request: { id, jsonrpc },
    topic,
  },
}: DenyRequest) {
  try {
    if (!client) {
      throw new Error('Missing client')
    }

    yield call(client.respond.bind(client), {
      topic,
      response: {
        id,
        jsonrpc,
        error: getError(WalletConnectErrors.NOT_APPROVED),
      },
    })
  } catch (e) {
    Logger.debug(TAG + '@denyRequest', e.message)
  } finally {
    navigateBack()
  }
}

export function* watchWalletConnectChannel() {
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
    Logger.debug(TAG + '@initialiseClient', `init start`)
    client = yield call(WalletConnectClient.init as any, {
      relayProvider: WALLETCONNECT_URL,
      storageOptions: {
        asyncStorage: AsyncStorage,
      },
      logger: 'error',
      controller: true,
    })
    Logger.debug(TAG + '@initialiseClient', `init end`)
    yield put(clientInitialised())
  }

  return eventChannel((emit: any) => {
    const onSessionProposal = (session: SessionTypes.Proposal) => emit(sessionProposal(session))
    const onSessionCreated = (session: SessionTypes.Created) => emit(sessionCreated(session))
    const onSessionUpdated = (session: SessionTypes.UpdateParams) => emit(sessionUpdated(session))
    const onSessionDeleted = (session: SessionTypes.DeleteParams) => emit(sessionDeleted(session))
    const onSessionRequest = (request: SessionTypes.RequestEvent) => emit(sessionPayload(request))

    const onPairingProposal = (pairing: PairingTypes.ProposeParams) =>
      emit(pairingProposal(pairing))
    const onPairingCreated = (pairing: PairingTypes.CreateParams) => emit(pairingCreated(pairing))
    const onPairingUpdated = (pairing: PairingTypes.UpdateParams) => emit(pairingUpdated(pairing))
    const onPairingDeleted = (pairing: PairingTypes.DeleteParams) => emit(pairingDeleted(pairing))

    if (!client) {
      return () => {
        Logger.debug(TAG + '@initialiseClient', 'missing client')
      }
    }

    client.on(CLIENT_EVENTS.session.proposal, onSessionProposal)
    client.on(CLIENT_EVENTS.session.created, onSessionCreated)
    client.on(CLIENT_EVENTS.session.updated, onSessionUpdated)
    client.on(CLIENT_EVENTS.session.deleted, onSessionDeleted)
    client.on(CLIENT_EVENTS.session.request, onSessionRequest)

    client.on(CLIENT_EVENTS.pairing.proposal, onPairingProposal)
    client.on(CLIENT_EVENTS.pairing.created, onPairingCreated)
    client.on(CLIENT_EVENTS.pairing.updated, onPairingUpdated)
    client.on(CLIENT_EVENTS.pairing.deleted, onPairingDeleted)

    return () => {
      if (!client) {
        Logger.debug(TAG + '@initialiseClient', 'missing client')
        return
      }

      client.off(CLIENT_EVENTS.session.proposal, onSessionProposal)
      client.off(CLIENT_EVENTS.session.created, onSessionCreated)
      client.off(CLIENT_EVENTS.session.updated, onSessionUpdated)
      client.off(CLIENT_EVENTS.session.deleted, onSessionDeleted)
      client.off(CLIENT_EVENTS.session.request, onSessionRequest)

      client.off(CLIENT_EVENTS.pairing.proposal, onPairingProposal)
      client.off(CLIENT_EVENTS.pairing.created, onPairingCreated)
      client.off(CLIENT_EVENTS.pairing.updated, onPairingUpdated)
      client.off(CLIENT_EVENTS.pairing.deleted, onPairingDeleted)

      const reason = getError(WalletConnectErrors.EXPIRED)
      client.session.topics.map((topic) => client!.disconnect({ reason, topic }))
      client.pairing.topics.map((topic) => client!.pairing.delete({ topic, reason }))
      client = null
    }
  })
}

export function* handleIncomingActionRequest({ request }: SessionPayload) {
  const pendingActions: SessionTypes.RequestEvent[] = yield select(selectPendingActions)
  if (pendingActions.length > 1) {
    // we handle this case in the {accept/deny}Request methods
    // and direct the user to the next request
    return
  }

  navigate(Screens.WalletConnectActionRequest, { request })
}
export function* handleIncomingSessionRequest({ session }: SessionProposal) {
  const { pending }: { pending: any[] } = yield select(selectSessions)
  if (pending.length) {
    // TODO: what shall we do here?
    Logger.debug(TAG + '@handleIncomingSessionRequest', 'existing pending session')
  }

  navigate(Screens.WalletConnectSessionRequest, { session })
}

export function* initialisePairing({ uri }: InitialisePairing) {
  try {
    if (!client) {
      throw new Error(`missing client`)
    }

    Logger.debug(TAG + '@initialisePairing', 'pair start')
    yield call(client.pair.bind(client), { uri })
    Logger.debug(TAG + '@initialisePairing', 'pair end')
  } catch (e) {
    Logger.debug(TAG + '@initialisePairing', e.message)
  }
}

export function* walletConnectSaga() {
  yield takeLeading(Actions.INITIALISE_CLIENT, watchWalletConnectChannel)
  yield takeEvery(Actions.INITIALISE_PAIRING, initialisePairing)

  yield takeEvery(Actions.ACCEPT_SESSION, acceptSession)
  yield takeEvery(Actions.DENY_SESSION, denySession)
  yield takeEvery(Actions.CLOSE_SESSION, closeSession)
  yield takeEvery(Actions.ACCEPT_REQUEST, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST, denyRequest)

  yield takeEvery(Actions.SESSION_PROPOSAL, handleIncomingSessionRequest)
  yield takeEvery(Actions.SESSION_PAYLOAD, handleIncomingActionRequest)
}

export function* initialiseWalletConnect(uri: string) {
  if (!client) {
    yield put(initialiseClientAction())
    yield take(Actions.CLIENT_INITIALISED)
  }
  yield put(initialisePairingAction(uri))
}
