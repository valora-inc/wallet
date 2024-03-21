import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { PayloadAction } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import erc20 from 'src/abis/IERC20'
import { SwapEvents } from 'src/analytics/Events'
import {
  PrefixedTxReceiptProperties,
  SwapTimeMetrics,
  SwapTxsReceiptProperties,
  TxReceiptProperties,
} from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigateHome } from 'src/navigator/NavigationService'
import { CANCELLED_PIN_INPUT } from 'src/pincode/authentication'
import { vibrateError } from 'src/styles/hapticFeedback'
import { getSwapTxsAnalyticsProperties } from 'src/swap/getSwapTxsAnalyticsProperties'
import { swapCancel, swapError, swapStart, swapSuccess } from 'src/swap/slice'
import { Field, SwapInfo } from 'src/swap/types'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance, TokenBalances } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import { BaseStandbyTransaction } from 'src/transactions/actions'
import { NetworkId, TokenTransactionTypeV2, newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import {
  TransactionRequest,
  getEstimatedGasFee,
  getFeeCurrency,
  getFeeCurrencyToken,
  getFeeDecimals,
  getMaxGasFee,
} from 'src/viem/prepareTransactions'
import { getPreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { sendPreparedTransactions } from 'src/viem/saga'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getNetworkFromNetworkId } from 'src/web3/utils'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import { Hash, TransactionReceipt, decodeFunctionData } from 'viem'

const TAG = 'swap/saga'

function calculateEstimatedUsdValue({
  tokenInfo,
  tokenAmount,
}: {
  tokenInfo: TokenBalance
  tokenAmount: string
}): number | undefined {
  if (!tokenInfo.priceUsd) {
    return undefined
  }

  return valueToBigNumber(tokenAmount).times(tokenInfo.priceUsd).toNumber()
}

interface TrackedTx {
  tx: TransactionRequest | undefined
  txHash: Hash | undefined
  txReceipt: TransactionReceipt | undefined
}

function getTxReceiptAnalyticsProperties(
  { tx, txHash, txReceipt }: TrackedTx,
  networkId: NetworkId,
  tokensById: TokenBalances
): Partial<TxReceiptProperties> {
  const feeCurrencyToken = tx && getFeeCurrencyToken([tx], networkId, tokensById)
  const feeDecimals = tx && feeCurrencyToken ? getFeeDecimals([tx], feeCurrencyToken) : undefined

  const txMaxGasFee = tx && feeDecimals ? getMaxGasFee([tx]).shiftedBy(-feeDecimals) : undefined
  const txMaxGasFeeUsd =
    feeCurrencyToken && txMaxGasFee && feeCurrencyToken.priceUsd
      ? txMaxGasFee.times(feeCurrencyToken.priceUsd)
      : undefined
  const txEstimatedGasFee =
    tx && feeDecimals ? getEstimatedGasFee([tx]).shiftedBy(-feeDecimals) : undefined
  const txEstimatedGasFeeUsd =
    feeCurrencyToken && txEstimatedGasFee && feeCurrencyToken.priceUsd
      ? txEstimatedGasFee.times(feeCurrencyToken.priceUsd)
      : undefined

  const txGasFee =
    txReceipt?.gasUsed && txReceipt?.effectiveGasPrice && feeDecimals
      ? new BigNumber((txReceipt.gasUsed * txReceipt.effectiveGasPrice).toString()).shiftedBy(
          -feeDecimals
        )
      : undefined
  const txGasFeeUsd =
    feeCurrencyToken && txGasFee && feeCurrencyToken.priceUsd
      ? txGasFee.times(feeCurrencyToken.priceUsd)
      : undefined

  return {
    txCumulativeGasUsed: txReceipt?.cumulativeGasUsed
      ? Number(txReceipt.cumulativeGasUsed)
      : undefined,
    txEffectiveGasPrice: txReceipt?.effectiveGasPrice
      ? Number(txReceipt.effectiveGasPrice)
      : undefined,
    txGas: tx?.gas ? Number(tx.gas) : undefined,
    txMaxGasFee: txMaxGasFee?.toNumber(),
    txMaxGasFeeUsd: txMaxGasFeeUsd?.toNumber(),
    txEstimatedGasFee: txEstimatedGasFee?.toNumber(),
    txEstimatedGasFeeUsd: txEstimatedGasFeeUsd?.toNumber(),
    txGasUsed: txReceipt?.gasUsed ? Number(txReceipt.gasUsed) : undefined,
    txGasFee: txGasFee?.toNumber(),
    txGasFeeUsd: txGasFeeUsd?.toNumber(),
    txHash,
    txFeeCurrency: tx && getFeeCurrency(tx),
    txFeeCurrencySymbol: feeCurrencyToken?.symbol,
  }
}

function getPrefixedTxAnalyticsProperties<Prefix extends string>(
  receiptProperties: Partial<TxReceiptProperties>,
  prefix: Prefix
): Partial<PrefixedTxReceiptProperties<Prefix>> {
  const prefixedProperties: Record<string, any> = {}
  for (const [key, value] of Object.entries(receiptProperties)) {
    prefixedProperties[`${prefix}${key[0].toUpperCase()}${key.slice(1)}`] = value
  }
  return prefixedProperties as Partial<PrefixedTxReceiptProperties<Prefix>>
}

function getSwapTxsReceiptAnalyticsProperties(
  trackedTxs: TrackedTx[],
  networkId: NetworkId,
  tokensById: TokenBalances
): SwapTxsReceiptProperties {
  const txs = trackedTxs.map((trackedTx) =>
    getTxReceiptAnalyticsProperties(trackedTx, networkId, tokensById)
  )

  const approveTx = trackedTxs.length > 1 ? txs[0] : undefined
  const swapTx = trackedTxs.length > 0 ? txs[txs.length - 1] : undefined

  return {
    ...getPrefixedTxAnalyticsProperties(approveTx || {}, 'approve'),
    ...getPrefixedTxAnalyticsProperties(swapTx || {}, 'swap'),
    gasUsed: swapTx?.txGasUsed ? txs.reduce((sum, tx) => sum + (tx.txGasUsed || 0), 0) : undefined,
    gasFee: swapTx?.txGasFee ? txs.reduce((sum, tx) => sum + (tx.txGasFee || 0), 0) : undefined,
    gasFeeUsd: swapTx?.txGasFeeUsd
      ? txs.reduce((sum, tx) => sum + (tx.txGasFeeUsd || 0), 0)
      : undefined,
  }
}

export function* swapSubmitSaga(action: PayloadAction<SwapInfo>) {
  const swapSubmittedAt = Date.now()
  const { swapId, userInput, quote, areSwapTokensShuffled } = action.payload
  const { fromTokenId, toTokenId, updatedField, swapAmount } = userInput
  const {
    provider,
    price,
    allowanceTarget,
    estimatedPriceImpact,
    preparedTransactions: serializablePreparedTransactions,
    receivedAt: quoteReceivedAt,
  } = quote
  const amountType = updatedField === Field.TO ? ('buyAmount' as const) : ('sellAmount' as const)
  const amount = swapAmount[updatedField]
  const preparedTransactions = getPreparedTransactions(serializablePreparedTransactions)

  const tokensById = yield* select((state) =>
    tokensByIdSelector(state, getSupportedNetworkIdsForSwap())
  )
  const fromToken = tokensById[fromTokenId]
  const toToken = tokensById[toTokenId]

  if (!fromToken || !toToken) {
    Logger.error(
      TAG,
      `Could not find to or from token for swap from ${fromTokenId} to ${toTokenId}`
    )
    yield* put(swapError(swapId))
    return
  }

  const fromTokenBalance = fromToken.balance.shiftedBy(fromToken.decimals).toString()
  const estimatedSellTokenUsdValue = calculateEstimatedUsdValue({
    tokenInfo: fromToken,
    tokenAmount: swapAmount[Field.FROM],
  })
  const estimatedBuyTokenUsdValue = calculateEstimatedUsdValue({
    tokenInfo: toToken,
    tokenAmount: swapAmount[Field.TO],
  })

  const swapApproveContext = newTransactionContext(TAG, 'Swap/Approve')
  const swapExecuteContext = newTransactionContext(TAG, 'Swap/Execute')

  const defaultSwapExecuteProps = {
    toToken: toToken.address,
    toTokenId: toToken.tokenId,
    toTokenNetworkId: toToken.networkId,
    toTokenIsImported: !!toToken.isManuallyImported,
    fromToken: fromToken.address,
    fromTokenId: fromToken.tokenId,
    fromTokenNetworkId: fromToken.networkId,
    fromTokenIsImported: !!fromToken.isManuallyImported,
    amount,
    amountType,
    price,
    allowanceTarget,
    estimatedPriceImpact,
    provider,
    fromTokenBalance,
    swapExecuteTxId: swapExecuteContext.id,
    swapApproveTxId: swapApproveContext.id,
    estimatedSellTokenUsdValue,
    estimatedBuyTokenUsdValue,
    web3Library: 'viem' as const,
    areSwapTokensShuffled,
    ...getSwapTxsAnalyticsProperties(preparedTransactions, fromToken.networkId, tokensById),
  }

  let quoteToTransactionElapsedTimeInMs: number | undefined

  const getTimeMetrics = (): SwapTimeMetrics => ({
    quoteToUserConfirmsSwapElapsedTimeInMs: swapSubmittedAt - quoteReceivedAt,
    quoteToTransactionElapsedTimeInMs,
  })

  const trackedTxs: TrackedTx[] = []
  const networkId = fromToken.networkId

  let submitted = false

  try {
    const network = getNetworkFromNetworkId(networkId)
    if (!network) {
      throw new Error('Unknown token network')
    }

    const wallet = yield* call(getViemWallet, networkConfig.viemChain[network])
    if (!wallet.account) {
      // this should never happen
      throw new Error('no account found in the wallet')
    }

    for (const tx of preparedTransactions) {
      trackedTxs.push({
        tx,
        txHash: undefined,
        txReceipt: undefined,
      })
    }

    // Execute transaction(s)
    Logger.debug(TAG, `Starting to swap execute for address: ${wallet.account.address}`)

    const beforeSwapExecutionTimestamp = Date.now()
    quoteToTransactionElapsedTimeInMs = beforeSwapExecutionTimestamp - quoteReceivedAt
    const createSwapStandbyTxHandlers = []

    // If there are 2 transactions, the first should be an approval. verify and
    // add a standby transaction for it
    if (preparedTransactions.length > 1 && preparedTransactions[0].data) {
      const { functionName, args } = yield* call(decodeFunctionData, {
        abi: erc20.abi,
        data: preparedTransactions[0].data,
      })
      if (functionName === 'approve' && preparedTransactions[0].to === fromToken.address && args) {
        const approvedAmountInSmallestUnit = args[1] as bigint
        const approvedAmount = new BigNumber(approvedAmountInSmallestUnit.toString())
          .shiftedBy(-fromToken.decimals)
          .toString()

        const createApprovalStandbyTx = (
          transactionHash: string,
          feeCurrencyId?: string
        ): BaseStandbyTransaction => {
          return {
            context: swapApproveContext,
            __typename: 'TokenApproval',
            networkId,
            type: TokenTransactionTypeV2.Approval,
            transactionHash,
            tokenId: fromToken.tokenId,
            approvedAmount,
            feeCurrencyId,
          }
        }
        createSwapStandbyTxHandlers.push(createApprovalStandbyTx)
      }
    }

    const createSwapStandbyTx = (
      transactionHash: string,
      feeCurrencyId?: string
    ): BaseStandbyTransaction => ({
      context: swapExecuteContext,
      __typename: 'TokenExchangeV3',
      networkId,
      type: TokenTransactionTypeV2.SwapTransaction,
      inAmount: {
        value: swapAmount[Field.TO],
        tokenId: toToken.tokenId,
      },
      outAmount: {
        value: swapAmount[Field.FROM],
        tokenId: fromToken.tokenId,
      },
      transactionHash,
      feeCurrencyId,
    })
    createSwapStandbyTxHandlers.push(createSwapStandbyTx)

    const txHashes = yield* call(
      sendPreparedTransactions,
      serializablePreparedTransactions,
      networkId,
      createSwapStandbyTxHandlers
    )
    txHashes.forEach((txHash, i) => {
      trackedTxs[i].txHash = txHash
    })

    Logger.debug(TAG, 'Successfully sent swap transaction(s) to the network', txHashes)

    navigateHome()
    submitted = true

    // wait for the tx receipts, so that we can track them
    for (let i = 0; i < txHashes.length; i++) {
      const txReceipt = yield* call([publicClient[network], 'waitForTransactionReceipt'], {
        hash: txHashes[i],
      })
      Logger.debug(`Got transaction receipt ${i + 1} of ${trackedTxs.length}`, txReceipt)
      trackedTxs[i].txReceipt = txReceipt
    }

    const swapTxReceipt = trackedTxs[trackedTxs.length - 1].txReceipt
    if (swapTxReceipt?.status !== 'success') {
      throw new Error(`Swap transaction reverted: ${swapTxReceipt?.transactionHash}`)
    }

    yield* put(swapSuccess({ swapId, fromTokenId, toTokenId }))
    ValoraAnalytics.track(SwapEvents.swap_execute_success, {
      ...defaultSwapExecuteProps,
      ...getTimeMetrics(),
      ...getSwapTxsReceiptAnalyticsProperties(trackedTxs, networkId, tokensById),
    })
  } catch (err) {
    if (err === CANCELLED_PIN_INPUT) {
      Logger.info(TAG, 'Swap cancelled by user')
      yield* put(swapCancel(swapId))
      return
    }
    const error = ensureError(err)
    // dispatch the error early, in case the rest of the handling throws
    // and leaves the app in a bad state
    yield* put(swapError(swapId))
    // Only vibrate if we haven't already submitted the transaction
    // since the user may be doing something else on the app by now
    // (different screen or a new swap)
    if (!submitted) {
      vibrateError()
    }

    Logger.error(TAG, 'Error while swapping', error)
    ValoraAnalytics.track(SwapEvents.swap_execute_error, {
      ...defaultSwapExecuteProps,
      ...getTimeMetrics(),
      ...getSwapTxsReceiptAnalyticsProperties(trackedTxs, networkId, tokensById),
      error: error.message,
    })
  }
}

export function* swapSaga() {
  yield* takeEvery(swapStart.type, safely(swapSubmitSaga))
}
