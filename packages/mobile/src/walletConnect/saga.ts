import { GenesisBlockUtils } from '@celo/network-utils'
import AsyncStorage from '@react-native-community/async-storage'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { call, put, select, take } from 'redux-saga/effects'
import { readGenesisBlockFile } from 'src/geth/geth'
import networkConfig from 'src/geth/networkConfig'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  Actions,
  NewTransactionsInFeedAction,
  removeStandbyTransaction,
} from 'src/transactions/actions'
import { standbyTransactionsSelector } from 'src/transactions/reducer'
import { StandbyTransaction, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import {
  clientInitialised,
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
import { getWalletConnectClient } from 'src/walletConnect/selectors'
import { getAccountAddress } from 'src/web3/saga'

const TAG = 'WalletConnect/saga'

// Remove standby txs from redux state when the real ones show up in the feed
function* cleanupStandbyTransactions({ transactions }: NewTransactionsInFeedAction) {
  const standbyTxs: StandbyTransaction[] = yield select(standbyTransactionsSelector)
  const newFeedTxHashes = new Set(transactions.map((tx) => tx?.hash))
  for (const standbyTx of standbyTxs) {
    if (
      standbyTx.hash &&
      standbyTx.status !== TransactionStatus.Failed &&
      newFeedTxHashes.has(standbyTx.hash)
    ) {
      yield put(removeStandbyTransaction(standbyTx.context.id))
    }
  }
}

export function* waitForTransactionWithId(txId: string) {
  while (true) {
    const action = yield take([Actions.TRANSACTION_CONFIRMED, Actions.TRANSACTION_FAILED])
    if (action.txId === txId) {
      // Return true for success, false otherwise
      return action.type === Actions.TRANSACTION_CONFIRMED
    }
  }
}

export function* acceptSession(proposal: SessionTypes.Proposal) {
  const { nodeDir } = networkConfig
  const genesis: string = yield call(readGenesisBlockFile, nodeDir)
  const networkId: number = GenesisBlockUtils.getChainIdFromGenesis(genesis)

  const account = yield select(getAccountAddress)
  const client = yield select(getWalletConnectClient)

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

export function* initialiseClient(uri: string) {
  Logger.debug(TAG + '@initialiseClient', `Establishing connection`)
  const client: WalletConnectClient = yield call(WalletConnectClient.init, {
    relayProvider: 'wss://bridge.walletconnect.org',
    storageOptions: {
      asyncStorage: AsyncStorage,
    },
  })
  Logger.debug(TAG + '@initialiseClient', `Connection initialised`)

  const onSessionPayload = async (event: SessionTypes.PayloadEvent) => {
    const {
      topic,
      // @ts-ignore todo: ask Pedro why this isn't typed
      payload: { id, method },
    } = event

    let result: any

    // if (method === SupportedMethods.personalSign) {
    //   const { payload, from } = parsePersonalSign(event)
    //   result = await wallet.signPersonalMessage(from, payload)
    // } else if (method === SupportedMethods.signTypedData) {
    //   const { from, payload } = parseSignTypedData(event)
    //   result = await wallet.signTypedData(from, payload)
    // } else if (method === SupportedMethods.signTransaction) {
    //   const tx = parseSignTransaction(event)
    //   result = await wallet.signTransaction(tx)
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

    // return client.respond({
    //   topic,
    //   response: {
    //     id,
    //     jsonrpc: '2.0',
    //     result,
    //   },
    // })
  }

  client.on(CLIENT_EVENTS.session.proposal, (session: SessionTypes.Proposal) => {
    console.log('proposal')
    put(sessionProposal(session))
    navigate(Screens.WalletConnectSessionRequest)
  })
  client.on(CLIENT_EVENTS.session.created, (session: SessionTypes.Created) => {
    console.log('created')
    put(sessionCreated(session))
  })
  client.on(CLIENT_EVENTS.session.updated, (session: SessionTypes.Update) => {
    console.log('updated')
    put(sessionUpdated(session))
  })
  client.on(CLIENT_EVENTS.session.deleted, (session: SessionTypes.DeleteParams) => {
    console.log('deleted')
    put(sessionDeleted(session))
  })
  client.on(CLIENT_EVENTS.session.payload, (payload: SessionTypes.PayloadEvent) => {
    console.log('payload')
    put(sessionPayload(payload))
  })

  client.on(CLIENT_EVENTS.pairing.proposal, (pairing: PairingTypes.Proposal) => {
    console.log('proposal')
    put(pairingProposal(pairing))
  })
  client.on(CLIENT_EVENTS.pairing.created, (pairing: PairingTypes.Created) => {
    console.log('created')
    put(pairingCreated(pairing))
  })
  client.on(CLIENT_EVENTS.pairing.updated, (pairing: PairingTypes.Update) => {
    console.log('updated')
    put(pairingUpdated(pairing))
  })
  client.on(CLIENT_EVENTS.pairing.deleted, (pairing: PairingTypes.DeleteParams) => {
    console.log('deleted')
    put(pairingDeleted(pairing))
  })

  console.log('pairing start')
  client.pair({ uri }).then((a) => {
    console.log('paired')
    put(clientInitialised(client))
  })
  // console.log(client.pair, { uri })
  // yield call(client.pair, { uri })
  // console.log('pairing end')
}
