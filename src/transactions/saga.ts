import { PayloadAction } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents, SwapEvents } from 'src/analytics/Events'
import { trackPointsEvent } from 'src/points/slice'
import { earnPositionsSelector } from 'src/positions/selectors'
import { RootState } from 'src/redux/store'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { BaseToken } from 'src/tokens/slice'
import { transactionFeedV2Api, TransactionFeedV2Response } from 'src/transactions/api'
import { pendingStandbyTransactionsSelector } from 'src/transactions/selectors'
import { transactionConfirmed, transactionsConfirmedFromFeedApi } from 'src/transactions/slice'
import {
  DepositOrWithdraw,
  Fee,
  FeeType,
  Network,
  NetworkId,
  StandbyTransaction,
  TokenExchange,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { getSupportedNetworkIds } from 'src/web3/utils'
import { call, delay, fork, put, select, spawn, takeEvery } from 'typed-redux-saga'
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
  const { feeCurrencyId, transactionHash, type } = transaction
  const isCrossChainSwapTransaction = type === TokenTransactionTypeV2.CrossChainSwapTransaction
  const isSwapTransaction = type === TokenTransactionTypeV2.SwapTransaction
  const isCrossChainDeposit = type === TokenTransactionTypeV2.CrossChainDeposit
  const isCrossChainTransaction = isCrossChainSwapTransaction || isCrossChainDeposit
  if (
    isCrossChainTransaction &&
    'isSourceNetworkTxConfirmed' in transaction &&
    transaction.isSourceNetworkTxConfirmed
  ) {
    Logger.info(
      `${TAG}@getTransactionReceipt`,
      `Skipping already confirmed cross-chain swap on source network ${transaction.transactionHash}`
    )
    return
  }

  const networkId = networkConfig.networkToNetworkId[network]

  try {
    const receipt = yield* call([publicClient[network], 'waitForTransactionReceipt'], {
      hash: transactionHash as Hash,
    })

    yield* call(handleTransactionReceiptReceived, {
      txId: transaction.context.id,
      receipt,
      networkId,
      feeCurrencyId,
      // The tx receipt for a cross-chain swap/deposit is for the source network only,
      // so we do not want to mark the whole cross-chain swap as completed if
      // the status here is successful. We do however want to update the
      // transaction details, including marking it as failed if the status is
      // reverted.
      overrideStatus:
        isCrossChainTransaction && receipt.status === 'success'
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
  const supportedNetworksByViem = Object.keys(publicClient) as Network[]
  const supportedNetworkIds = new Set([...(yield* call(getSupportedNetworkIds))])

  const supportedNetworks = supportedNetworksByViem.filter((network) =>
    supportedNetworkIds.has(networkConfig.networkToNetworkId[network])
  )

  for (const network of supportedNetworks) {
    yield* spawn(watchPendingTransactionsInNetwork, network)
  }
}

export function* handleTransactionFeedV2ApiFulfilled(
  action: PayloadAction<TransactionFeedV2Response>
) {
  const state = yield* select((state) => state)
  const pendingStandbyTxs = yield* select(pendingStandbyTransactionsSelector)
  const newlyCompletedCrossChainTxs = action.payload.transactions.filter(
    (tx): tx is TokenExchange | DepositOrWithdraw =>
      tx.status === TransactionStatus.Complete &&
      (tx.type === TokenTransactionTypeV2.CrossChainSwapTransaction ||
        tx.type === TokenTransactionTypeV2.CrossChainDeposit) &&
      pendingStandbyTxs.some((standbyTx) => standbyTx.transactionHash === tx.transactionHash)
  )

  Logger.debug(
    TAG,
    'handleTransactionFeedV2ApiFulfilled newlyCompletedCrossChainTxs',
    newlyCompletedCrossChainTxs.length
  )

  trackCompletionOfCrossChainTxs(state, newlyCompletedCrossChainTxs)

  yield* put(transactionsConfirmedFromFeedApi(action.payload.transactions))
}

function* watchTransactionFeedV2ApiFulfilled() {
  yield* takeEvery(
    transactionFeedV2Api.endpoints.transactionFeedV2.matchFulfilled,
    handleTransactionFeedV2ApiFulfilled
  )
}

export function* transactionSaga() {
  yield* spawn(watchPendingTransactions)
  yield* spawn(watchTransactionFeedV2ApiFulfilled)
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

function trackCompletionOfCrossChainTxs(
  state: RootState,
  transactions: (TokenExchange | DepositOrWithdraw)[]
) {
  const tokensById = tokensByIdSelector(state, getSupportedNetworkIds())

  for (const tx of transactions) {
    const networkFee = tx.fees.find((fee) => fee.type === FeeType.SecurityFee)
    const networkFeeTokenPrice = networkFee && tokensById[networkFee?.amount.tokenId]?.priceUsd
    const appFee = tx.fees.find((fee) => fee.type === FeeType.AppFee)
    const appFeeTokenPrice = appFee && tokensById[appFee?.amount.tokenId]?.priceUsd
    const crossChainFee = tx.fees.find((fee) => fee.type === FeeType.CrossChainFee)
    const crossChainFeeTokenPrice =
      crossChainFee && tokensById[crossChainFee?.amount.tokenId]?.priceUsd

    const feeProperties = {
      networkFeeTokenId: networkFee?.amount.tokenId,
      networkFeeAmount: networkFee?.amount.value.toString(),
      networkFeeAmountUsd:
        networkFeeTokenPrice && networkFee.amount.value
          ? BigNumber(networkFee.amount.value).times(networkFeeTokenPrice).toNumber()
          : undefined,
      appFeeTokenId: appFee?.amount.tokenId,
      appFeeAmount: appFee?.amount.value.toString(),
      appFeeAmountUsd:
        appFeeTokenPrice && appFee.amount.value
          ? BigNumber(appFee.amount.value).times(appFeeTokenPrice).toNumber()
          : undefined,
      crossChainFeeTokenId: crossChainFee?.amount.tokenId,
      crossChainFeeAmount: crossChainFee?.amount.value.toString(),
      crossChainFeeAmountUsd:
        crossChainFeeTokenPrice && crossChainFee.amount.value
          ? BigNumber(crossChainFee.amount.value).times(crossChainFeeTokenPrice).toNumber()
          : undefined,
    }

    if (tx.type === TokenTransactionTypeV2.CrossChainSwapTransaction) {
      const toTokenPrice = tokensById[tx.inAmount.tokenId]?.priceUsd
      const fromTokenPrice = tokensById[tx.outAmount.tokenId]?.priceUsd

      AppAnalytics.track(SwapEvents.swap_execute_success, {
        swapType: 'cross-chain',
        swapExecuteTxId: tx.transactionHash,
        toTokenId: tx.inAmount.tokenId,
        toTokenAmount: tx.inAmount.value.toString(),
        toTokenAmountUsd: toTokenPrice
          ? BigNumber(tx.inAmount.value).times(toTokenPrice).toNumber()
          : undefined,
        fromTokenId: tx.outAmount.tokenId,
        fromTokenAmount: tx.outAmount.value.toString(),
        fromTokenAmountUsd: fromTokenPrice
          ? BigNumber(tx.outAmount.value).times(fromTokenPrice).toNumber()
          : undefined,
        ...feeProperties,
      })
    } else if (tx.type === TokenTransactionTypeV2.CrossChainDeposit) {
      const depositTokenId = tx.outAmount.tokenId
      const position = earnPositionsSelector(state).find(
        (position) => position.dataProps?.depositTokenId === depositTokenId
      )
      AppAnalytics.track(EarnEvents.earn_deposit_execute_success, {
        networkId: position?.networkId,
        poolId: position?.positionId,
        providerId: position?.appId,
        depositTokenId,
        depositTokenAmount: tx.outAmount.value.toString(),
        mode: 'swap-deposit',
        swapType: 'cross-chain',
        fromTokenAmount: tx.swap?.outAmount.value.toString(),
        fromTokenId: tx.swap?.outAmount.tokenId,
        fromNetworkId: tx.networkId,
        ...feeProperties,
      })
    } else {
      // should never happen
      Logger.warn(TAG, 'Unknown cross-chain transaction type', tx)
    }
  }
}
