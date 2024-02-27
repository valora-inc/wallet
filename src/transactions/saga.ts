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
import { tokensByIdSelector } from 'src/tokens/selectors'
import { BaseToken, fetchTokenBalances } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSend, getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import {
  Actions,
  UpdateTransactionsAction,
  addHashToStandbyTransaction,
  removeStandbyTransaction,
  transactionConfirmed,
  updateInviteTransactions,
  updateRecentTxRecipientsCache,
} from 'src/transactions/actions'
import { TxPromises } from 'src/transactions/contract-utils'
import {
  KnownFeedTransactionsType,
  inviteTransactionsSelector,
  knownFeedTransactionsSelector,
  pendingStandbyTransactionsSelector,
  standbyTransactionsSelector,
} from 'src/transactions/reducer'
import { sendTransactionPromises, wrapSendTransactionWithRetry } from 'src/transactions/send'
import {
  Fee,
  Network,
  NetworkId,
  StandbyTransaction,
  TokenTransactionTypeV2,
  TransactionContext,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import { getContractKit } from 'src/web3/contracts'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { call, delay, fork, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'
import { Hash, TransactionReceipt } from 'viem'

const TAG = 'transactions/saga'

const RECENT_TX_RECIPIENT_CACHE_LIMIT = 10

// These are in msecs and you want a value that's equal to the average
// blocktime and no less than MINIMUM_WATCHING_DELAY_MS. (will be ignored if under MINIMUM_WATCHING_DELAY_MS)
const WATCHING_DELAY_BY_NETWORK: Record<Network, number> = {
  [Network.Celo]: 5000,
  [Network.Ethereum]: 15000,
  [Network.Arbitrum]: 2000,
  [Network.Optimism]: 2000,
}
const MIN_WATCHING_DELAY_MS = 2000

// Remove standby txs from redux state when the real ones show up in the feed
function* cleanupStandbyTransactions({ transactions, networkId }: UpdateTransactionsAction) {
  const standbyTxs: StandbyTransaction[] = yield* select(standbyTransactionsSelector)
  const newFeedTxHashes = new Set(transactions.map((tx) => tx?.transactionHash))
  for (const standbyTx of standbyTxs) {
    if (
      standbyTx.transactionHash &&
      standbyTx.networkId === networkId &&
      newFeedTxHashes.has(standbyTx.transactionHash)
    ) {
      yield* put(removeStandbyTransaction(standbyTx.context.id))
    }
  }
}

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

export function* getInviteTransactionsDetails({ transactions }: UpdateTransactionsAction) {
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

    // This won't show fees in the standby tx.
    // Getting the selected fee currency is hard since it happens inside of `sendTransactionPromises`.
    // This code will be deprecated when we remove the contract kit dependency, so I think it's fine to leave it as is.
    yield* call(
      handleTransactionReceiptReceived,
      context.id,
      txReceipt,
      networkConfig.defaultNetworkId
    )

    yield* put(fetchTokenBalances({ showLoading: true }))
    return { receipt: txReceipt }
  } catch (error) {
    Logger.error(TAG + '@sendAndMonitorTransaction', `Error sending tx ${context.id}`, error)
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
  yield* takeEvery(Actions.UPDATE_TRANSACTIONS, safely(cleanupStandbyTransactions))
  yield* takeEvery(Actions.UPDATE_TRANSACTIONS, safely(getInviteTransactionsDetails))
  yield* takeLatest(Actions.UPDATE_TRANSACTIONS, safely(refreshRecentTxRecipients))
}

function* watchAddressToE164PhoneNumberUpdate() {
  yield* takeLatest(
    IdentityActions.UPDATE_E164_PHONE_NUMBER_ADDRESSES,
    safely(refreshRecentTxRecipients)
  )
}

export function* getTransactionReceipt(
  transaction: StandbyTransaction & { transactionHash: string },
  network: Network
) {
  const { feeCurrencyId, transactionHash } = transaction

  try {
    const receipt = yield* call([publicClient[network], 'getTransactionReceipt'], {
      hash: transactionHash as Hash,
    })

    if (receipt) {
      yield* call(
        handleTransactionReceiptReceived,
        transaction.context.id,
        receipt,
        networkConfig.networkToNetworkId[network],
        feeCurrencyId
      )
    }
  } catch (e) {
    Logger.warn(
      TAG,
      `Error found when trying to fetch status for transaction with hash: ${transactionHash} in ${network}`,
      (e as Error).message
    )
  }
}

export function* internalWatchPendingTransactionsInNetwork(network: Network) {
  const pendingStandbyTransactions = yield* select(pendingStandbyTransactionsSelector)
  const filteredPendingTxs = pendingStandbyTransactions.filter((tx) => {
    return tx.networkId === networkConfig.networkToNetworkId[network] && tx.transactionHash
  })

  for (const transaction of filteredPendingTxs) {
    yield* fork(getTransactionReceipt, transaction, network)
  }
}

export function* watchPendingTransactionsInNetwork(network: Network) {
  while (true) {
    yield* call(internalWatchPendingTransactionsInNetwork, network)
    const delayTimeMs = Math.max(WATCHING_DELAY_BY_NETWORK[network], MIN_WATCHING_DELAY_MS)
    yield* delay(delayTimeMs) // avoid polling too often and using up CPU
  }
}

export function* watchPendingTransactions() {
  const supportedNetworkIdsForSend = yield* call(getSupportedNetworkIdsForSend)
  const supportedNetworkIdsForSwap = yield* call(getSupportedNetworkIdsForSwap)
  const supportedNetworksByViem = Object.keys(publicClient) as Network[]
  const supportedNetworkIds = new Set([
    ...supportedNetworkIdsForSend,
    ...supportedNetworkIdsForSwap,
  ])

  const supportedNetworks = supportedNetworksByViem.filter((network) =>
    supportedNetworkIds.has(networkConfig.networkToNetworkId[network])
  )

  for (const network of supportedNetworks) {
    yield* spawn(watchPendingTransactionsInNetwork, network)
  }
}

export function* transactionSaga() {
  yield* spawn(watchNewFeedTransactions)
  yield* spawn(watchAddressToE164PhoneNumberUpdate)
  yield* spawn(watchPendingTransactions)
}

export function* handleTransactionReceiptReceived(
  txId: string,
  receipt: TransactionReceipt | CeloTxReceipt,
  networkId: NetworkId,
  feeCurrencyId?: string
) {
  const tokensById = yield* select((state) => tokensByIdSelector(state, [networkId]))

  const feeTokenInfo = feeCurrencyId && tokensById[feeCurrencyId]

  if (!!feeCurrencyId && !feeTokenInfo) {
    Logger.error(
      TAG,
      `No information found for fee currency ${feeCurrencyId} in network ${networkId} for transaction ${txId}`
    )
  }

  const gasFeeInSmallestUnit = new BigNumber(receipt.gasUsed.toString()).times(
    new BigNumber(receipt.effectiveGasPrice.toString())
  )

  const baseDetails = {
    transactionHash: receipt.transactionHash,
    block: receipt.blockNumber.toString(),
    status:
      receipt.status === 'reverted' || !receipt.status
        ? TransactionStatus.Failed
        : TransactionStatus.Complete,
  }

  const blockDetails = yield* call([publicClient[networkIdToNetwork[networkId]], 'getBlock'], {
    blockNumber: BigInt(receipt.blockNumber),
  })
  const blockTimestampInMs = Number(blockDetails.timestamp) * 1000

  yield* put(
    transactionConfirmed(
      txId,
      {
        ...baseDetails,
        fees: feeTokenInfo ? buildGasFees(feeTokenInfo, gasFeeInSmallestUnit) : [],
      },
      blockTimestampInMs
    )
  )
}

function buildGasFees(feeCurrencyInfo: BaseToken, gasFeeInSmallestUnit: BigNumber): Fee[] {
  return [
    {
      type: 'SECURITY_FEE',
      amount: {
        value: gasFeeInSmallestUnit.shiftedBy(-feeCurrencyInfo.decimals).toFixed(),
        tokenId: feeCurrencyInfo.tokenId,
      },
    },
  ]
}
