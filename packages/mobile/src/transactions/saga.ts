import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import BigNumber from 'bignumber.js'
import { all, call, put, select, spawn, take, takeEvery, takeLatest } from 'redux-saga/effects'
import { getProfileInfo } from 'src/account/profileInfo'
import { showError } from 'src/alert/actions'
import {
  TokenTransactionType,
  TransactionFeedFragment,
  TransferItemFragment,
} from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { fetchGoldBalance } from 'src/goldToken/actions'
import { Actions as IdentityActions } from 'src/identity/actions'
import { addressToE164NumberSelector, AddressToE164NumberType } from 'src/identity/reducer'
import { AddressToRecipient, NumberToRecipient } from 'src/recipients/recipient'
import { phoneRecipientCacheSelector, updateValoraRecipientCache } from 'src/recipients/reducer'
import { fetchStableBalances } from 'src/stableToken/actions'
import {
  Actions,
  addHashToStandbyTransaction,
  NewTransactionsInFeedAction,
  removeStandbyTransaction,
  transactionConfirmed,
  TransactionConfirmedAction,
  transactionFailed,
  TransactionFailedAction,
  updateRecentTxRecipientsCache,
} from 'src/transactions/actions'
import { TxPromises } from 'src/transactions/contract-utils'
import {
  knownFeedTransactionsSelector,
  KnownFeedTransactionsType,
  standbyTransactionsSelector,
} from 'src/transactions/reducer'
import { sendTransactionPromises, wrapSendTransactionWithRetry } from 'src/transactions/send'
import { isTransferTransaction } from 'src/transactions/transferFeedUtils'
import { StandbyTransaction, TransactionContext, TransactionStatus } from 'src/transactions/types'
import { Currency, STABLE_CURRENCIES } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

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
    const action: TransactionConfirmedAction | TransactionFailedAction = yield take([
      Actions.TRANSACTION_CONFIRMED,
      Actions.TRANSACTION_FAILED,
    ])
    if (action.txId === txId) {
      // Return the receipt on success and undefined otherwise.
      return action.type === Actions.TRANSACTION_CONFIRMED ? action.receipt : undefined
    }
  }
}

export function* sendAndMonitorTransaction<T>(
  tx: CeloTransactionObject<T>,
  account: string,
  context: TransactionContext,
  currency?: Currency,
  feeCurrency?: Currency,
  gas?: number,
  gasPrice?: BigNumber,
  nonce?: number
) {
  try {
    Logger.debug(TAG + '@sendAndMonitorTransaction', `Sending transaction with id: ${context.id}`)

    const sendTxMethod = function* () {
      const { transactionHash, receipt }: TxPromises = yield call(
        sendTransactionPromises,
        tx.txo,
        account,
        context,
        feeCurrency,
        gas,
        gasPrice,
        nonce
      )
      const hash: string = yield transactionHash
      yield put(addHashToStandbyTransaction(context.id, hash))
      return (yield receipt) as CeloTxReceipt
    }
    const txReceipt: CeloTxReceipt = yield call(wrapSendTransactionWithRetry, sendTxMethod, context)
    yield put(transactionConfirmed(context.id, txReceipt))

    // Determine which balances may be affected by the transaction and fetch updated balances.
    const balancesAffected = new Set([
      ...(currency ? [currency] : [Currency.Dollar, Currency.Celo]),
      feeCurrency ?? Currency.Dollar,
    ])
    if (balancesAffected.has(Currency.Celo)) {
      yield put(fetchGoldBalance())
    }
    if (STABLE_CURRENCIES.some((stableCurrency) => balancesAffected.has(stableCurrency))) {
      yield put(fetchStableBalances())
    }
    return { receipt: txReceipt }
  } catch (error) {
    Logger.error(TAG + '@sendAndMonitorTransaction', `Error sending tx ${context.id}`, error)
    yield put(removeStandbyTransaction(context.id))
    yield put(transactionFailed(context.id))
    yield put(showError(ErrorMessages.TRANSACTION_FAILED))
    return { error }
  }
}

function* refreshRecentTxRecipients() {
  const addressToE164Number: AddressToE164NumberType = yield select(addressToE164NumberSelector)
  const recipientCache: NumberToRecipient = yield select(phoneRecipientCacheSelector)
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
    if (e164PhoneNumber) {
      const cachedRecipient = recipientCache[e164PhoneNumber]
      // Skip if there is no recipient to cache or we've already cached them
      if (!cachedRecipient || recentTxRecipientsCache[e164PhoneNumber]) {
        continue
      }

      recentTxRecipientsCache[e164PhoneNumber] = cachedRecipient
      remainingCacheStorage -= 1
    }
  }

  yield put(updateRecentTxRecipientsCache(recentTxRecipientsCache))
}

function* addProfile(address: string) {
  const info = yield call(getProfileInfo, address)
  if (info) {
    const newProfile: AddressToRecipient = {
      [address]: {
        address,
        name: info?.name,
        thumbnailPath: info?.thumbnailPath,
      },
    }
    yield put(updateValoraRecipientCache(newProfile))
    Logger.info(TAG, `added ${newProfile} to valoraRecipientCache`)
  }
}

function getDistinctReceivedAddresses(transactions: TransactionFeedFragment[]) {
  return Array.from(
    new Set(
      transactions
        .filter(
          (trans) => isTransferTransaction(trans) && trans.type === TokenTransactionType.Received
        )
        .map((trans) => (trans as TransferItemFragment).address)
    )
  )
}

function* addRecipientProfiles({ transactions }: NewTransactionsInFeedAction) {
  yield all(getDistinctReceivedAddresses(transactions).map((address) => call(addProfile, address)))
}

function* watchNewFeedTransactions() {
  yield takeEvery(Actions.NEW_TRANSACTIONS_IN_FEED, cleanupStandbyTransactions)
  yield takeEvery(Actions.NEW_TRANSACTIONS_IN_FEED, addRecipientProfiles)
  yield takeLatest(Actions.NEW_TRANSACTIONS_IN_FEED, refreshRecentTxRecipients)
}

function* watchAddressToE164PhoneNumberUpdate() {
  yield takeLatest(IdentityActions.UPDATE_E164_PHONE_NUMBER_ADDRESSES, refreshRecentTxRecipients)
}

export function* transactionSaga() {
  yield spawn(watchNewFeedTransactions)
  yield spawn(watchAddressToE164PhoneNumberUpdate)
}
