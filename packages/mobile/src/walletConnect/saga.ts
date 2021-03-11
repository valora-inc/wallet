import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { call, put, select, spawn, take, takeEvery, takeLatest } from 'redux-saga/effects'
import { Actions as IdentityActions } from 'src/identity/actions'
import { addressToE164NumberSelector } from 'src/identity/reducer'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import {
  Actions,
  NewTransactionsInFeedAction,
  removeStandbyTransaction,
  updateRecentTxRecipientsCache,
} from 'src/transactions/actions'
import {
  knownFeedTransactionsSelector,
  KnownFeedTransactionsType,
  standbyTransactionsSelector,
} from 'src/transactions/reducer'
import { StandbyTransaction, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import {
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

const TAG = 'transactions/saga'

const RECENT_TX_RECIPIENT_CACHE_LIMIT = 10

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

export function* connectSession(uri: string) {
  const client = yield select(getWalletConnectClient)
  yield call(client.pair, { uri })
}

export function* initialiseClient(uri: string) {
  Logger.debug(TAG + '@initialiseClient', `Establishing connection`)
  const account = yield select(getAccountAddress)
  const client: WalletConnectClient = yield call(WalletConnectClient.init, { relayProvider: '' })

  // const onSessionProposal = (proposal: SessionTypes.Proposal) => {
  //   const response: SessionTypes.Response = {
  //     metadata: {
  //       name: 'Wallet',
  //       description: 'A mobile payments wallet that works worldwide',
  //       url: 'https://wallet.com',
  //       icons: ['https://wallet.com/favicon.ico'],
  //     },
  //     state: {
  //       accounts: [`${account}@celo:44787`],
  //     },
  //   }
  //   return client.approve({ proposal, response })
  // }
  // const onSessionCreated = (session: SessionTypes.Created) => {
  //   put(SessionCreated(session))
  //   sessionTopic = session.topic
  // }
  // const onSessionUpdated = (session: SessionTypes.Update) => {
  //   debug('onSessionUpdated', session)
  // }
  // const onSessionDeleted = (session: SessionTypes.DeleteParams) => {
  //   debug('onSessionDeleted', session)
  // }

  // const onPairingProposal = (pairing: PairingTypes.Proposal) => {
  //   debug('onPairingProposal', pairing)
  // }
  // const onPairingCreated = (pairing: PairingTypes.Created) => {
  //   pairingTopic = pairing.topic
  // }
  // const onPairingUpdated = (pairing: PairingTypes.Update) => {
  //   debug('onPairingUpdated', pairing)
  // }
  // const onPairingDeleted = (pairing: PairingTypes.DeleteParams) => {
  //   debug('onPairingDeleted', pairing)
  // }

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

  client.on(CLIENT_EVENTS.session.proposal, (session: SessionTypes.Proposal) =>
    put(sessionProposal(session))
  )
  client.on(CLIENT_EVENTS.session.created, (session: SessionTypes.Created) =>
    put(sessionCreated(session))
  )
  client.on(CLIENT_EVENTS.session.updated, (session: SessionTypes.Update) =>
    put(sessionUpdated(session))
  )
  client.on(CLIENT_EVENTS.session.deleted, (session: SessionTypes.DeleteParams) =>
    put(sessionDeleted(session))
  )
  client.on(CLIENT_EVENTS.session.payload, (payload: SessionTypes.PayloadEvent) =>
    put(sessionPayload(payload))
  )

  client.on(CLIENT_EVENTS.pairing.proposal, (pairing: PairingTypes.Proposal) =>
    put(pairingProposal(pairing))
  )
  client.on(CLIENT_EVENTS.pairing.created, (pairing: PairingTypes.Created) =>
    put(pairingCreated(pairing))
  )
  client.on(CLIENT_EVENTS.pairing.updated, (pairing: PairingTypes.Update) =>
    put(pairingUpdated(pairing))
  )
  client.on(CLIENT_EVENTS.pairing.deleted, (pairing: PairingTypes.DeleteParams) =>
    put(pairingDeleted(pairing))
  )
}

function* refreshRecentTxRecipients() {
  const addressToE164Number = yield select(addressToE164NumberSelector)
  const recipientCache = yield select(recipientCacheSelector)
  const knownFeedTransactions: KnownFeedTransactionsType = yield select(
    knownFeedTransactionsSelector
  )

  // No way to match addresses to recipients without caches
  if (
    !Object.keys(recipientCache).length ||
    !Object.keys(addressToE164Number).length ||
    !Object.keys(knownFeedTransactions).length
  ) {
    return
  }

  const knownFeedAddresses = Object.values(knownFeedTransactions)

  let remainingCacheStorage = RECENT_TX_RECIPIENT_CACHE_LIMIT
  const recentTxRecipientsCache: NumberToRecipient = {}
  // Start from back of the array to get the most recent transactions
  for (let i = knownFeedAddresses.length - 1; i >= 0; i -= 1) {
    if (remainingCacheStorage <= 0) {
      break
    }

    const address = knownFeedAddresses[i]
    // Address is not a string if transaction was an Exchange
    if (typeof address !== 'string') {
      continue
    }

    const e164PhoneNumber = addressToE164Number[address]
    const cachedRecipient = recipientCache[e164PhoneNumber]
    // Skip if there is no recipient to cache or we've already cached them
    if (!cachedRecipient || recentTxRecipientsCache[e164PhoneNumber]) {
      continue
    }

    recentTxRecipientsCache[e164PhoneNumber] = cachedRecipient
    remainingCacheStorage -= 1
  }

  yield put(updateRecentTxRecipientsCache(recentTxRecipientsCache))
}

function* watchNewFeedTransactions() {
  yield takeEvery(Actions.NEW_TRANSACTIONS_IN_FEED, cleanupStandbyTransactions)
  yield takeLatest(Actions.NEW_TRANSACTIONS_IN_FEED, refreshRecentTxRecipients)
}

function* watchAddressToE164PhoneNumberUpdate() {
  yield takeLatest(IdentityActions.UPDATE_E164_PHONE_NUMBER_ADDRESSES, refreshRecentTxRecipients)
}

export function* transactionSaga() {
  yield spawn(watchNewFeedTransactions)
  yield spawn(watchAddressToE164PhoneNumberUpdate)
}
