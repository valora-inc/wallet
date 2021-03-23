import { GenesisBlockUtils } from '@celo/network-utils'
import AsyncStorage from '@react-native-community/async-storage'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { eventChannel } from 'redux-saga'
import { spawn } from 'redux-saga-test-plan/matchers'
import { call, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { readGenesisBlockFile } from 'src/geth/geth'
import networkConfig from 'src/geth/networkConfig'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  clientInitialised,
  initialiseClient as initialiseClientAction,
  initialisePairing as initialisePairingAction,
  pairingCreated,
  pairingDeleted,
  pairingProposal,
  pairingUpdated,
  sessionCreated,
  sessionDeleted,
  sessionPayload,
  sessionProposal,
  sessionUpdated,
} from 'src/walletConnect/actions'
import { pendingConnectionSelector, walletConnectClientSelector } from 'src/walletConnect/selectors'
import { getAccountAddress } from 'src/web3/saga'

const TAG = 'WalletConnect/saga'

export function* acceptSession({ proposal }: AcceptSession) {
  const { nodeDir } = networkConfig
  const genesis: string = yield call(readGenesisBlockFile, nodeDir)
  const networkId: number = GenesisBlockUtils.getChainIdFromGenesis(genesis)

  const account = yield call(getAccountAddress)
  const client = yield select(walletConnectClientSelector)

  console.log('>>> account', account)
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
  console.log('acceptSession', proposal, response)

  yield call(client.approve.bind(client), { proposal, response })
}

export function* denySession() {}

export function* acceptRequest({ id, topic, result }: AcceptRequest) {
  const client = yield select(walletConnectClientSelector)

  yield call(client.respond, {
    topic,
    response: {
      id,
      jsonrpc: '2.0',
      result,
    },
  })
  navigate(Screens.WalletConnectSessions)
}

export function* denyRequest() {}

export function* startWalletConnectChannel() {
  yield takeLeading(Actions.INITIALISE_CLIENT, watchWalletConnectChannel)
}

export function* watchWalletConnectChannel() {
  const walletConnectChannel = yield call(createWalletConnectChannel)
  while (true) {
    const message = yield take(walletConnectChannel)
    Logger.debug(TAG + '@watchWalletConnectChannel', JSON.stringify(message))
    yield put(message)
  }
}

export function* createWalletConnectChannel() {
  Logger.debug(TAG + '@initialiseClient', `init start`)
  try {
    const client = yield call(WalletConnectClient.init, {
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
      console.log('event channel')
      client.on(CLIENT_EVENTS.session.proposal, (session: SessionTypes.Proposal) => {
        console.log('emitting')
        emit(sessionProposal(session))
      })
      client.on(CLIENT_EVENTS.session.created, (session: SessionTypes.Created) => {
        console.log('emitting')
        emit(sessionCreated(session))
      })
      client.on(CLIENT_EVENTS.session.updated, (session: SessionTypes.Update) => {
        console.log('emitting')
        emit(sessionUpdated(session))
      })
      client.on(CLIENT_EVENTS.session.deleted, (session: SessionTypes.DeleteParams) => {
        console.log('emitting')
        emit(sessionDeleted(session))
      })
      client.on(CLIENT_EVENTS.session.request, (payload: SessionTypes.RespondParams) => {
        console.log('emitting')
        emit(sessionPayload(payload))
      })

      client.on(CLIENT_EVENTS.pairing.proposal, (pairing: PairingTypes.Proposal) => {
        console.log('emitting')
        emit(pairingProposal(pairing))
      })
      client.on(CLIENT_EVENTS.pairing.created, (pairing: PairingTypes.Created) => {
        console.log('emitting')
        emit(pairingCreated(pairing))
      })
      client.on(CLIENT_EVENTS.pairing.updated, (pairing: PairingTypes.Update) => {
        console.log('emitting')
        emit(pairingUpdated(pairing))
      })
      client.on(CLIENT_EVENTS.pairing.deleted, (pairing: PairingTypes.DeleteParams) => {
        console.log('emitting')
        emit(pairingDeleted(pairing))
      })

      return () => {}
    })
  } catch (e) {
    console.log('uncaught e', e)
  }
}

export function* navigateToPendingRequests() {
  navigate(Screens.WalletConnectRequest)
}

export function* initialisePairing() {
  console.log('initialisePairing')
  const client = yield select(walletConnectClientSelector)
  const pendingConnection = yield select(pendingConnectionSelector)
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
  yield takeEvery(Actions.ACCEPT_REQUEST, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST, denyRequest)

  yield takeEvery(Actions.SESSION_PAYLOAD, navigateToPendingRequests)
}

export function* initialiseWalletConnect(uri: string) {
  const client = yield select(walletConnectClientSelector)
  if (!client) {
    yield put(initialiseClientAction())
    yield take(Actions.CLIENT_INITIALISED)
  } else {
  }
  yield put(initialisePairingAction(uri))
}
