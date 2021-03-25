import { EncodedTransaction } from '@celo/connect'
import { GenesisBlockUtils } from '@celo/network-utils'
import { UnlockableWallet } from '@celo/wallet-base'
import AsyncStorage from '@react-native-community/async-storage'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { EventChannel, eventChannel } from 'redux-saga'
import { spawn } from 'redux-saga-test-plan/matchers'
import { call, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { readGenesisBlockFile } from 'src/geth/geth'
import networkConfig from 'src/geth/networkConfig'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  clientInitialised,
  CloseSession,
  closeSession as closeSessionAction,
  DenyRequest,
  initialiseClient as initialiseClientAction,
  initialisePairing as initialisePairingAction,
  pairingCreated,
  pairingDeleted,
  pairingProposal,
  pairingUpdated,
  requestFulfilled,
  sessionCreated,
  sessionDeleted,
  SessionPayload,
  sessionPayload,
  sessionProposal,
  sessionUpdated,
} from 'src/walletConnect/actions'
import { SupportedActions } from 'src/walletConnect/constants'
import { pendingConnectionSelector, walletConnectClientSelector } from 'src/walletConnect/selectors'
import { getWallet } from 'src/web3/contracts'
import { getAccountAddress, unlockAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'WalletConnect/saga'

export function* acceptSession({ proposal }: AcceptSession) {
  const { nodeDir } = networkConfig
  const genesis: string = yield call(readGenesisBlockFile, nodeDir)
  const networkId: number = GenesisBlockUtils.getChainIdFromGenesis(genesis)

  const account: string = yield call(getAccountAddress)
  const client: WalletConnectClient = yield select(walletConnectClientSelector)

  const response: SessionTypes.Response = {
    metadata: {
      name: 'Valora',
      description: 'A mobile payments wallet that works worldwide',
      url: 'https://valoraapp.com',
      icons: ['https://valoraapp.com/favicon.ico'],
    },
    state: {
      accounts: [`${account}@celo:${networkId}`],
    },
  }

  yield call(client.approve.bind(client), { proposal, response })
}

export function* denySession() {}

export function* closeSession({ session }: CloseSession) {
  const client: WalletConnectClient = yield select(walletConnectClientSelector)
  yield call(client.disconnect.bind(client), {
    topic: session.topic,
    reason: 'Closed by user',
  })
  yield put(closeSessionAction(session))
}

export function* acceptRequest({
  request: {
    // @ts-ignore
    request: { id, jsonrpc, method, params },
    topic,
  },
}: AcceptRequest) {
  const client: WalletConnectClient = yield select(walletConnectClientSelector)
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
  yield put(requestFulfilled(id))

  navigateBack()
}

export function* denyRequest({
  request: {
    // @ts-ignore
    request: { id, jsonrpc },
    topic,
  },
}: DenyRequest) {
  const client: WalletConnectClient = yield select(walletConnectClientSelector)

  yield call(client.respond.bind(client), {
    topic,
    response: {
      id,
      jsonrpc,
      error: {
        code: -32000,
        reason: 'Rejected request',
      },
    },
  })
  yield put(requestFulfilled(id))

  navigateBack()
}

export function* startWalletConnectChannel() {
  yield takeLeading(Actions.INITIALISE_CLIENT, watchWalletConnectChannel)
}

export function* watchWalletConnectChannel() {
  const walletConnectChannel: EventChannel<any> = yield call(createWalletConnectChannel)
  while (true) {
    const message: any = yield take(walletConnectChannel)
    Logger.debug(TAG + '@watchWalletConnectChannel', JSON.stringify(message))
    yield put(message)
  }
}

export function* createWalletConnectChannel() {
  Logger.debug(TAG + '@initialiseClient', `init start`)

  const client: WalletConnectClient = yield call(WalletConnectClient.init, {
    relayProvider: 'wss://relay.walletconnect.org',
    storageOptions: {
      asyncStorage: AsyncStorage,
    },
    logger: 'error',
    controller: true,
  })
  Logger.debug(TAG + '@initialiseClient', `init end`)
  yield put(clientInitialised(client))

  return eventChannel((emit: any) => {
    const onSessionProposal = (session: SessionTypes.Proposal) => emit(sessionProposal(session))
    const onSessionCreated = (session: SessionTypes.Created) => emit(sessionCreated(session))
    const onSessionUpdated = (session: SessionTypes.Update) => emit(sessionUpdated(session))
    const onSessionDeleted = (session: SessionTypes.DeleteParams) => emit(sessionDeleted(session))
    const onSessionRequest = (request: SessionTypes.RequestEvent) => emit(sessionPayload(request))

    const onPairingProposal = (pairing: PairingTypes.Proposal) => emit(pairingProposal(pairing))
    const onPairingCreated = (pairing: PairingTypes.Created) => emit(pairingCreated(pairing))
    const onPairingUpdated = (pairing: PairingTypes.Update) => emit(pairingUpdated(pairing))
    const onPairingDeleted = (pairing: PairingTypes.DeleteParams) => emit(pairingDeleted(pairing))

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
      client.off(CLIENT_EVENTS.session.proposal, onSessionProposal)
      client.off(CLIENT_EVENTS.session.created, onSessionCreated)
      client.off(CLIENT_EVENTS.session.updated, onSessionUpdated)
      client.off(CLIENT_EVENTS.session.deleted, onSessionDeleted)
      client.off(CLIENT_EVENTS.session.request, onSessionRequest)

      client.off(CLIENT_EVENTS.pairing.proposal, onPairingProposal)
      client.off(CLIENT_EVENTS.pairing.created, onPairingCreated)
      client.off(CLIENT_EVENTS.pairing.updated, onPairingUpdated)
      client.off(CLIENT_EVENTS.pairing.deleted, onPairingDeleted)

      client.session.topics.map((topic) => client.disconnect({ reason: 'End of session', topic }))
      client.pairing.topics.map((topic) =>
        client.pairing.delete({ topic, reason: 'End of session' })
      )
    }
  })
}

export function* navigateToRequest({ request }: SessionPayload) {
  navigate(Screens.WalletConnectActionRequest, { request })
}

export function* initialisePairing() {
  const client: WalletConnectClient = yield select(walletConnectClientSelector)
  const pendingConnection: string = yield select(pendingConnectionSelector)
  if (!client) {
    Logger.warn(TAG + '@initialiseClient', `missing client`)
    return
  }
  if (!pendingConnection) {
    Logger.warn(TAG + '@initialiseClient', `missing uri`)
    return
  }

  Logger.debug(TAG + '@initialiseClient', `pair start`)
  yield call(client.pair.bind(client), { uri: pendingConnection })
  Logger.debug(TAG + '@initialiseClient', `pair end`)
}

export function* walletConnectSaga() {
  yield spawn(startWalletConnectChannel)
  yield takeEvery(Actions.INITIALISE_PAIRING, initialisePairing)

  yield takeEvery(Actions.ACCEPT_SESSION, acceptSession)
  yield takeEvery(Actions.DENY_SESSION, denySession)
  yield takeEvery(Actions.CLOSE_SESSION, closeSession)
  yield takeEvery(Actions.ACCEPT_REQUEST, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST, denyRequest)

  yield takeEvery(Actions.SESSION_PAYLOAD, navigateToRequest)
}

export function* initialiseWalletConnect(uri: string) {
  const client: WalletConnectClient = yield select(walletConnectClientSelector)
  if (!client) {
    yield put(initialiseClientAction())
    yield take(Actions.CLIENT_INITIALISED)
  } else {
  }
  yield put(initialisePairingAction(uri))
}
