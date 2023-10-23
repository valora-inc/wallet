import { CeloTransactionObject, CeloTxReceipt, EventLog } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { EscrowWrapper } from '@celo/contractkit/lib/wrappers/Escrow'
import BigNumber from 'bignumber.js'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Actions as IdentityActions } from 'src/identity/actions'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { addressToE164NumberSelector } from 'src/identity/selectors'
import { NumberToRecipient } from 'src/recipients/recipient'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import { fetchTokenBalances } from 'src/tokens/slice'
import {
  Actions,
  TransactionFeedUpdatedAction,
  addHashToStandbyTransaction,
  removeStandbyTransaction,
  transactionFailed,
  updateInviteTransactions,
  updateRecentTxRecipientsCache,
} from 'src/transactions/actions'
import { TxPromises } from 'src/transactions/contract-utils'
import {
  KnownFeedTransactionsType,
  inviteTransactionsSelector,
  knownFeedTransactionsSelector,
} from 'src/transactions/reducer'
import { sendTransactionPromises, wrapSendTransactionWithRetry } from 'src/transactions/send'
import { TokenTransactionTypeV2, TransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { getContractKit } from 'src/web3/contracts'
import { call, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'

const TAG = 'transactions/saga'

const RECENT_TX_RECIPIENT_CACHE_LIMIT = 10

function* getInviteTransactionDetails(txHash: string, blockNumber: string) {
  const kit: ContractKit = yield* call(getContractKit)
  const escrowWrapper: EscrowWrapper = yield* call([kit.contracts, kit.contracts.getEscrow])
  const transferEvents: EventLog[] = yield* call(
    [escrowWrapper, escrowWrapper.getPastEvents],
    escrowWrapper.eventTypes.Transfer,
    {
      fromBlock: blockNumber,
      toBlock: blockNumber,
    }
  )
  const transactionDetails = transferEvents.find(
    (transferEvent) => transferEvent.transactionHash === txHash
  )

  if (!transactionDetails) {
    Logger.error(
      `${TAG}@getInviteTransactionDetails`,
      `No escrow past events found with transaction hash ${txHash} and block number ${blockNumber}`
    )
    return {}
  }

  return {
    recipientIdentifier: transactionDetails.returnValues.identifier,
    paymentId: transactionDetails.returnValues.paymentId,
  }
}

export function* getInviteTransactionsDetails({ transactions }: TransactionFeedUpdatedAction) {
  const existingInviteTransactions = yield* select(inviteTransactionsSelector)
  const newInviteTransactions = transactions.filter(
    (transaction) =>
      transaction.type === TokenTransactionTypeV2.InviteSent &&
      !existingInviteTransactions[transaction.transactionHash]
  )

  if (newInviteTransactions.length <= 0) {
    return
  }

  const inviteTransactions = { ...existingInviteTransactions }
  for (const newInviteTransaction of newInviteTransactions) {
    const { recipientIdentifier, paymentId } = yield* call(
      getInviteTransactionDetails,
      newInviteTransaction.transactionHash,
      newInviteTransaction.block
    )
    if (recipientIdentifier && paymentId) {
      inviteTransactions[newInviteTransaction.transactionHash] = {
        paymentId,
        recipientIdentifier,
      }
    }
  }
  yield* put(updateInviteTransactions(inviteTransactions))
}

export function* sendAndMonitorTransaction<T>(
  tx: CeloTransactionObject<T>,
  account: string,
  context: TransactionContext,
  feeCurrency?: string | undefined,
  gas?: number,
  gasPrice?: BigNumber,
  nonce?: number
) {
  try {
    Logger.debug(TAG + '@sendAndMonitorTransaction', `Sending transaction with id: ${context.id}`)

    const sendTxMethod = function* () {
      const { transactionHash, receipt }: TxPromises = yield* call(
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
      yield* put(addHashToStandbyTransaction(context.id, hash))
      return (yield receipt) as CeloTxReceipt
    }
    // there is a bug with 'race' in typed-redux-saga, so we need to hard cast the result
    // https://github.com/agiledigital/typed-redux-saga/issues/43#issuecomment-1259706876
    const txReceipt: CeloTxReceipt = (yield* call(
      wrapSendTransactionWithRetry,
      sendTxMethod,
      context
    )) as unknown as CeloTxReceipt

    yield* put(fetchTokenBalances({ showLoading: true }))
    return { receipt: txReceipt }
  } catch (error) {
    Logger.error(TAG + '@sendAndMonitorTransaction', `Error sending tx ${context.id}`, error)
    yield* put(removeStandbyTransaction(context.id))
    yield* put(transactionFailed(context.id))
    yield* put(showError(ErrorMessages.TRANSACTION_FAILED))
    return { error }
  }
}

function* refreshRecentTxRecipients() {
  const addressToE164Number: AddressToE164NumberType = yield* select(addressToE164NumberSelector)
  const recipientCache: NumberToRecipient = yield* select(phoneRecipientCacheSelector)
  const knownFeedTransactions: KnownFeedTransactionsType = yield* select(
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

  yield* put(updateRecentTxRecipientsCache(recentTxRecipientsCache))
}

function* watchNewFeedTransactions() {
  yield* takeEvery(Actions.TRANSACTION_FEED_UPDATED, safely(getInviteTransactionsDetails))
  yield* takeLatest(Actions.TRANSACTION_FEED_UPDATED, safely(refreshRecentTxRecipients))
}

function* watchAddressToE164PhoneNumberUpdate() {
  yield* takeLatest(
    IdentityActions.UPDATE_E164_PHONE_NUMBER_ADDRESSES,
    safely(refreshRecentTxRecipients)
  )
}

export function* transactionSaga() {
  yield* spawn(watchNewFeedTransactions)
  yield* spawn(watchAddressToE164PhoneNumberUpdate)
}
