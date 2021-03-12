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
import Logger from 'src/utils/Logger'
import {
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

export function* acceptSession(proposal: SessionTypes.Proposal) {
  const { nodeDir } = networkConfig
  const genesis: string = yield call(readGenesisBlockFile, nodeDir)
  const networkId: number = GenesisBlockUtils.getChainIdFromGenesis(genesis)

  const account = yield select(getAccountAddress)
  const client = yield select(walletConnectClientSelector)

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

  client.approve({ proposal, response })
}

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
  const client = yield call(WalletConnectClient.init, {
    relayProvider: 'wss://bridge.walletconnect.org/',
    storageOptions: {
      asyncStorage: AsyncStorage,
    },
    logger: 'error',
  })
  yield put(clientInitialised(client))
  Logger.debug(TAG + '@initialiseClient', `init end`)

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
    client.on(CLIENT_EVENTS.session.payload, (payload: SessionTypes.PayloadEvent) => {
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
}

// export function* initialiseClient() {
//   try {
//     const onSessionPayload = async (event: SessionTypes.PayloadEvent) => {
//       const {
//         topic,
//         // @ts-ignore todo: ask Pedro why this isn't typed
//         payload: { id, method },
//       } = event

//       let result: any

//       // if (method === SupportedMethods.personalSign) {
//       //   const { payload, from } = parsePersonalSign(event)
//       //   result = await wallet.signPersonalMessage(from, payload)
//       // } else if (method === SupportedMethods.signTypedData) {
//       //   const { from, payload } = parseSignTypedData(event)
//       //   result = await wallet.signTypedData(from, payload)
//       // } else if (method === SupportedMethods.signTransaction) {
//       //   const tx = parseSignTransaction(event)
//       //   result = await wallet.signTransaction(tx)
//       // } else if (method === SupportedMethods.computeSharedSecret) {
//       //   const { from, publicKey } = parseComputeSharedSecret(event)
//       //   result = (await wallet.computeSharedSecret(from, publicKey)).toString('hex')
//       // } else if (method === SupportedMethods.decrypt) {
//       //   const { from, payload } = parseDecrypt(event)
//       //   result = (await wallet.decrypt(from, payload)).toString('hex')
//       // } else {
//       //   // client.reject({})
//       //   // in memory wallet should always approve actions
//       //   debug('unknown method', method)
//       //   return
//       // }

//       // return client.respond({
//       //   topic,
//       //   response: {
//       //     id,
//       //     jsonrpc: '2.0',
//       //     result,
//       //   },
//       // })
//     }
//   } catch (e) {
//     console.log('>>>', e)
//   }
// }

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
}

export function* initialiseWalletConnect(uri: string) {
  const client = yield select(walletConnectClientSelector)
  if (!client) {
    yield put(initialiseClientAction())
    yield take(Actions.CLIENT_INITIALISED)
  }
  yield put(initialisePairingAction(uri))
}
