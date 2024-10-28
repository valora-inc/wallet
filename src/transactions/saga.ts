import BigNumber from 'bignumber.js'
import { trackPointsEvent } from 'src/points/slice'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { BaseToken } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSend, getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import { pendingStandbyTransactionsSelector } from 'src/transactions/selectors'
import { transactionConfirmed } from 'src/transactions/slice'
import {
  Fee,
  Network,
  NetworkId,
  StandbyTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { call, delay, fork, put, select, spawn } from 'typed-redux-saga'
import { Hash, TransactionReceipt } from 'viem'

const TAG = 'transactions/saga'

// These are in msecs and you want a value that's equal to the average
// blocktime and no less than MINIMUM_WATCHING_DELAY_MS. (will be ignored if under MINIMUM_WATCHING_DELAY_MS)
const WATCHING_DELAY_BY_NETWORK: Record<Network, number> = {
  [Network.Celo]: 5000,
  [Network.Ethereum]: 15000,
  [Network.Arbitrum]: 2000,
  [Network.Optimism]: 2000,
  [Network.PolygonPoS]: 2000,
  [Network.Base]: 2000,
}
const MIN_WATCHING_DELAY_MS = 2000

export function* getTransactionReceipt(
  transaction: StandbyTransaction & { transactionHash: string },
  network: Network
) {
  if (
    transaction.type === TokenTransactionTypeV2.CrossChainSwapTransaction &&
    'isSourceNetworkTxConfirmed' in transaction &&
    transaction.isSourceNetworkTxConfirmed
  ) {
    Logger.info(
      `${TAG}@getTransactionReceipt`,
      `Skipping already confirmed cross-chain swap on source network ${transaction.transactionHash}`
    )
    return
  }

  const { feeCurrencyId, transactionHash, type } = transaction
  const networkId = networkConfig.networkToNetworkId[network]
  const isCrossChainSwapTransaction = type === TokenTransactionTypeV2.CrossChainSwapTransaction
  const isSwapTransaction = type === TokenTransactionTypeV2.SwapTransaction

  try {
    const receipt = yield* call([publicClient[network], 'waitForTransactionReceipt'], {
      hash: transactionHash as Hash,
    })

    yield* call(handleTransactionReceiptReceived, {
      txId: transaction.context.id,
      receipt,
      networkId,
      feeCurrencyId,
      // The tx receipt for a cross-chain swap is for the source network only,
      // so we do not want to mark the whole cross-chain swap as completed if
      // the status here is successful. We do however want to update the
      // transaction details, including marking it as failed if the status is
      // reverted.
      overrideStatus:
        isCrossChainSwapTransaction && receipt.status === 'success'
          ? TransactionStatus.Pending
          : undefined,
    })

    if (receipt.status === 'success') {
      if (isSwapTransaction || isCrossChainSwapTransaction) {
        yield* put(
          trackPointsEvent({
            activityId: 'swap',
            transactionHash,
            networkId,
            fromTokenId: transaction.outAmount.tokenId,
            toTokenId: transaction.inAmount.tokenId,
          })
        )
      }
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
  yield* spawn(watchPendingTransactions)
}

function* handleTransactionReceiptReceived({
  txId,
  receipt,
  networkId,
  feeCurrencyId,
  overrideStatus,
}: {
  txId: string
  receipt: TransactionReceipt
  networkId: NetworkId
  feeCurrencyId?: string
  overrideStatus?: TransactionStatus
}) {
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

  const transactionStatusFromReceipt =
    receipt.status === 'reverted' || !receipt.status
      ? TransactionStatus.Failed
      : TransactionStatus.Complete
  const baseDetails = {
    transactionHash: receipt.transactionHash,
    block: receipt.blockNumber.toString(),
    status: overrideStatus ?? transactionStatusFromReceipt,
  }

  const blockDetails = yield* call([publicClient[networkIdToNetwork[networkId]], 'getBlock'], {
    blockNumber: BigInt(receipt.blockNumber),
  })
  const blockTimestampInMs = Number(blockDetails.timestamp) * 1000

  yield* put(
    transactionConfirmed({
      txId,
      receipt: {
        ...baseDetails,
        fees: feeTokenInfo ? buildGasFees(feeTokenInfo, gasFeeInSmallestUnit) : [],
      },
      blockTimestampInMs,
    })
  )
}

function buildGasFees(feeCurrencyInfo: BaseToken, gasFeeInSmallestUnit: BigNumber): Fee[] {
  return [
    {
      type: 'SECURITY_FEE',
      amount: {
        // TODO: would be more correct to check the actual fee currency (ERC20 or adapter) set in the TX
        // in the meantime, this is good enough
        value: gasFeeInSmallestUnit
          .shiftedBy(-(feeCurrencyInfo.feeCurrencyAdapterDecimals ?? feeCurrencyInfo.decimals))
          .toFixed(),
        tokenId: feeCurrencyInfo.tokenId,
      },
    },
  ]
}
