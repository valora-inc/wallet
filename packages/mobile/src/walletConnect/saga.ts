import { GenesisBlockUtils } from '@celo/network-utils'
import { UnlockableWallet } from '@celo/wallet-base'
import AsyncStorage from '@react-native-community/async-storage'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { eventChannel } from 'redux-saga'
import { spawn } from 'redux-saga-test-plan/matchers'
import { call, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { readGenesisBlockFile } from 'src/geth/geth'
import networkConfig from 'src/geth/networkConfig'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getPasswordSaga } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  clientInitialised,
  CloseSession,
  initialiseClient as initialiseClientAction,
  initialisePairing as initialisePairingAction,
  pairingCreated,
  pairingDeleted,
  pairingProposal,
  pairingUpdated,
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
import { getAccountAddress } from 'src/web3/saga'
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
}

export function* acceptRequest({
  request: {
    request: { id, jsonrpc, method, params },
    topic,
  },
}: AcceptRequest) {
  const client: WalletConnectClient = yield select(walletConnectClientSelector)
  const account: string = yield select(currentAccountSelector)
  const wallet: UnlockableWallet = yield call(getWallet)
  const password: string = yield call(getPasswordSaga, account, false, true)
  yield call([wallet, wallet.unlockAccount], account, password, UNLOCK_DURATION)

  console.log('unlocked')

  let result: any

  // if (method === SupportedMethods.personalSign) {
  //   const { payload, from } = parsePersonalSign(event)
  //   result = await wallet.signPersonalMessage(from, payload)
  // } else if (method === SupportedMethods.signTypedData) {
  //   const { from, payload } = parseSignTypedData(event)
  //   result = await wallet.signTypedData(from, payload)
  if (method === SupportedActions.eth_signTransaction) {
    console.log('sigining', params)
    result = yield call([wallet, wallet.signTransaction], params)
    console.log(result)
    // } else if (method === SupportedMethods.computeSharedSecret) {
    //   const { from, publicKey } = parseComputeSharedSecret(event)
    //   result = (await wallet.computeSharedSecret(from, publicKey)).toString('hex')
    // } else if (method === SupportedMethods.decrypt) {
    //   const { from, payload } = parseDecrypt(event)
    //   result = (await wallet.decrypt(from, payload)).toString('hex')
    // } else {
    //   // client.reject({})
    //   // in memory wallet should always approve actions
    //   debug('unknown method', method)
    //   return
    // }
  }

  yield call(client.respond.bind(client), {
    topic,
    response: {
      id,
      jsonrpc,
      result,
    },
  })
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
      client.on(CLIENT_EVENTS.session.proposal, (session: SessionTypes.Proposal) => {
        emit(sessionProposal(session))
      })
      client.on(CLIENT_EVENTS.session.created, (session: SessionTypes.Created) => {
        emit(sessionCreated(session))
      })
      client.on(CLIENT_EVENTS.session.updated, (session: SessionTypes.Update) => {
        emit(sessionUpdated(session))
      })
      client.on(CLIENT_EVENTS.session.deleted, (session: SessionTypes.DeleteParams) => {
        emit(sessionDeleted(session))
      })
      client.on(CLIENT_EVENTS.session.request, (payload: SessionTypes.RequestEvent) => {
        emit(sessionPayload(payload))
      })

      client.on(CLIENT_EVENTS.pairing.proposal, (pairing: PairingTypes.Proposal) => {
        emit(pairingProposal(pairing))
      })
      client.on(CLIENT_EVENTS.pairing.created, (pairing: PairingTypes.Created) => {
        emit(pairingCreated(pairing))
      })
      client.on(CLIENT_EVENTS.pairing.updated, (pairing: PairingTypes.Update) => {
        emit(pairingUpdated(pairing))
      })
      client.on(CLIENT_EVENTS.pairing.deleted, (pairing: PairingTypes.DeleteParams) => {
        console.log('Pairing deleted')
        emit(pairingDeleted(pairing))
      })

      return () => {
        console.log(`
        ====
CHANNEL CLEAN UP RUNNING
        ===
        `)
        // todo: deregister events and close client?
      }
    })
  } catch (e) {
    console.log('uncaught e', e)
  }
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
