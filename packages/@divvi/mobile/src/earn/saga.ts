import { PayloadAction } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { EarnDepositTxsReceiptProperties } from 'src/analytics/Properties'
import { isRegistrationTransaction } from 'src/divviProtocol/registerReferral'
import {
  depositCancel,
  depositError,
  depositStart,
  depositSuccess,
  withdrawCancel,
  withdrawError,
  withdrawStart,
  withdrawSuccess,
} from 'src/earn/slice'
import { DepositInfo, WithdrawInfo } from 'src/earn/types'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { navigateHome } from 'src/navigator/NavigationService'
import { CANCELLED_PIN_INPUT } from 'src/pincode/authentication'
import { vibrateError } from 'src/styles/hapticFeedback'
import { getTokenInfo } from 'src/tokens/saga'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalances } from 'src/tokens/slice'
import { BaseStandbyTransaction } from 'src/transactions/slice'
import {
  NetworkId,
  TokenTransactionTypeV2,
  TrackedTx,
  newTransactionContext,
} from 'src/transactions/types'
import {
  getPrefixedTxAnalyticsProperties,
  getTxReceiptAnalyticsProperties,
} from 'src/transactions/utils'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import { getPreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { sendPreparedTransactions } from 'src/viem/saga'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { all, call, put, select, takeLeading } from 'typed-redux-saga'
import { decodeFunctionData, erc20Abi } from 'viem'

const TAG = 'earn/saga'

function getDepositTxsReceiptAnalyticsProperties(
  trackedTxs: TrackedTx[],
  networkId: NetworkId,
  tokensById: TokenBalances
): EarnDepositTxsReceiptProperties {
  const txs = trackedTxs.map((trackedTx) =>
    getTxReceiptAnalyticsProperties(trackedTx, networkId, tokensById)
  )

  const approveTx = trackedTxs.length > 1 ? txs[0] : undefined
  const depositTx = trackedTxs.length > 0 ? txs[txs.length - 1] : undefined

  return {
    ...getPrefixedTxAnalyticsProperties(approveTx || {}, 'approve'),
    ...getPrefixedTxAnalyticsProperties(depositTx || {}, 'deposit'),
    gasUsed: depositTx?.txGasUsed
      ? txs.reduce((sum, tx) => sum + (tx.txGasUsed || 0), 0)
      : undefined,
    gasFee: depositTx?.txGasFee ? txs.reduce((sum, tx) => sum + (tx.txGasFee || 0), 0) : undefined,
    gasFeeUsd: depositTx?.txGasFeeUsd
      ? txs.reduce((sum, tx) => sum + (tx.txGasFeeUsd || 0), 0)
      : undefined,
  }
}

export function* depositSubmitSaga(action: PayloadAction<DepositInfo>) {
  const {
    pool,
    preparedTransactions: serializablePreparedTransactions,
    amount,
    mode,
    fromTokenAmount,
    fromTokenId,
  } = action.payload
  const depositTokenId = pool.dataProps.depositTokenId

  const preparedTransactions = getPreparedTransactions(
    serializablePreparedTransactions.filter((tx) => !isRegistrationTransaction(tx))
  )

  const depositTokenInfo = yield* call(getTokenInfo, depositTokenId)
  const fromTokenInfo = yield* call(getTokenInfo, fromTokenId)
  if (!depositTokenInfo || !fromTokenInfo) {
    Logger.error(
      `${TAG}/depositSubmitSaga`,
      `Token info not found for token ids ${depositTokenId} and/or ${fromTokenId}`
    )
    yield* put(depositError())
    return
  }

  const tokensById = yield* select((state) =>
    tokensByIdSelector(state, { networkIds: [pool.networkId], includePositionTokens: true })
  )

  const trackedTxs: TrackedTx[] = []
  const poolNetworkId = pool.networkId
  const fromNetworkId = fromTokenInfo.networkId
  const commonAnalyticsProps = {
    depositTokenId,
    depositTokenAmount: amount,
    networkId: poolNetworkId,
    providerId: pool.appId,
    poolId: pool.positionId,
    fromTokenAmount,
    fromTokenId,
    fromNetworkId,
    mode,
    swapType:
      mode === 'swap-deposit'
        ? fromNetworkId === poolNetworkId
          ? ('same-chain' as const)
          : ('cross-chain' as const)
        : undefined,
  }

  let submitted = false

  try {
    Logger.debug(
      `${TAG}/depositSubmitSaga`,
      `Starting ${mode} with token ${fromTokenId}, total transactions: ${preparedTransactions.length}`
    )

    for (const tx of preparedTransactions) {
      trackedTxs.push({
        tx,
        txHash: undefined,
        txReceipt: undefined,
      })
    }

    const createDepositStandbyTxHandlers = []

    if (preparedTransactions.length <= 2) {
      // if there are 1 or 2 transactions, its an approve (optional) and deposit
      if (preparedTransactions.length > 1 && preparedTransactions[0].data) {
        const { functionName, args } = decodeFunctionData({
          abi: erc20Abi,
          data: preparedTransactions[0].data,
        })
        if (
          functionName === 'approve' &&
          preparedTransactions[0].to === fromTokenInfo.address &&
          args
        ) {
          Logger.debug(`${TAG}/depositSubmitSaga`, 'First transaction is an approval transaction')
          const approvedAmountInSmallestUnit = args[1] as bigint
          const approvedAmount = new BigNumber(approvedAmountInSmallestUnit.toString())
            .shiftedBy(-fromTokenInfo.decimals)
            .toString()

          const createApprovalStandbyTx = (
            transactionHash: string,
            feeCurrencyId?: string
          ): BaseStandbyTransaction => {
            return {
              context: newTransactionContext(TAG, 'Earn/Approve'),
              networkId: fromNetworkId,
              type: TokenTransactionTypeV2.Approval,
              transactionHash,
              tokenId: fromTokenId,
              approvedAmount,
              feeCurrencyId,
            }
          }
          createDepositStandbyTxHandlers.push(createApprovalStandbyTx)
        } else {
          Logger.info(
            TAG,
            'First transaction is not an expected approval transaction, using empty standby handler'
          )
          createDepositStandbyTxHandlers.push(() => null)
        }
      }

      const createDepositStandbyTx = (
        transactionHash: string,
        feeCurrencyId?: string
      ): BaseStandbyTransaction => {
        return {
          context: newTransactionContext(TAG, 'Earn/Deposit'),
          networkId: fromNetworkId,
          type:
            mode === 'swap-deposit' && fromNetworkId !== poolNetworkId
              ? TokenTransactionTypeV2.CrossChainDeposit
              : TokenTransactionTypeV2.Deposit,
          inAmount: {
            value: amount,
            tokenId: pool.dataProps.withdrawTokenId,
          },
          outAmount: {
            value: amount,
            tokenId: depositTokenId,
          },
          appName: pool.appName,
          transactionHash,
          feeCurrencyId,
          ...(mode === 'swap-deposit' && {
            swap: {
              inAmount: { value: amount, tokenId: depositTokenId },
              outAmount: { value: fromTokenAmount, tokenId: fromTokenId },
            },
          }),
        }
      }
      createDepositStandbyTxHandlers.push(createDepositStandbyTx)
    } else {
      Logger.info(TAG, 'More than 2 deposit transactions, using empty standby handlers')
      createDepositStandbyTxHandlers.push(...preparedTransactions.map(() => () => null))
    }

    AppAnalytics.track(EarnEvents.earn_deposit_submit_start, commonAnalyticsProps)

    const txHashes = yield* call(
      sendPreparedTransactions,
      serializablePreparedTransactions,
      fromNetworkId,
      createDepositStandbyTxHandlers,
      isGasSubsidizedForNetwork(fromNetworkId)
    )
    txHashes.forEach((txHash, i) => {
      trackedTxs[i].txHash = txHash
    })

    Logger.debug(
      `${TAG}/depositSubmitSaga`,
      'Successfully sent deposit transaction(s) to the network',
      txHashes
    )

    navigateHome()
    submitted = true

    // wait for the tx receipts, so that we can track them
    Logger.debug(`${TAG}/depositSubmitSaga`, 'Waiting for transaction receipts')
    const txReceipts = yield* all(
      txHashes.map((txHash) => {
        return call(
          [publicClient[networkIdToNetwork[fromNetworkId]], 'waitForTransactionReceipt'],
          {
            hash: txHash,
          }
        )
      })
    )
    txReceipts.forEach((receipt, index) => {
      trackedTxs[index].txReceipt = receipt
      Logger.debug(
        `${TAG}/depositSubmitSaga`,
        `Received transaction receipt ${index + 1} of ${txReceipts.length}`,
        receipt
      )
    })

    const depositTxReceipt = txReceipts[txReceipts.length - 1]
    if (depositTxReceipt.status !== 'success') {
      throw new Error(`Deposit transaction reverted: ${depositTxReceipt?.transactionHash}`)
    }

    AppAnalytics.track(EarnEvents.earn_deposit_submit_success, {
      ...commonAnalyticsProps,
      ...getDepositTxsReceiptAnalyticsProperties(trackedTxs, poolNetworkId, tokensById),
    })
    if (fromNetworkId === poolNetworkId) {
      // for non cross chain swaps, we can fire this here. For cross chain
      // swaps, we'll fire it once the blockchain-api confirms the transaction
      AppAnalytics.track(EarnEvents.earn_deposit_execute_success, commonAnalyticsProps)
    }
    yield* put(
      depositSuccess({
        tokenId: depositTokenInfo.tokenId,
        networkId: poolNetworkId,
        transactionHash: txHashes[txHashes.length - 1],
      })
    )
  } catch (err) {
    if (err === CANCELLED_PIN_INPUT) {
      Logger.info(`${TAG}/depositSubmitSaga`, 'Transaction cancelled by user')
      yield* put(depositCancel())
      AppAnalytics.track(EarnEvents.earn_deposit_submit_cancel, commonAnalyticsProps)
      return
    }

    const error = ensureError(err)
    Logger.error(`${TAG}/depositSubmitSaga`, 'Error sending deposit transaction', error)
    yield* put(depositError())
    AppAnalytics.track(EarnEvents.earn_deposit_submit_error, {
      ...commonAnalyticsProps,
      error: error.message,
      ...getDepositTxsReceiptAnalyticsProperties(trackedTxs, poolNetworkId, tokensById),
    })

    // Only vibrate if we haven't already submitted the transaction
    // since the user may be doing something else on the app by now
    if (!submitted) {
      vibrateError()
    }
  }
}

export function* withdrawSubmitSaga(action: PayloadAction<WithdrawInfo>) {
  const {
    pool,
    preparedTransactions: serializablePreparedTransactions,
    rewardsTokens,
    amount,
    mode,
  } = action.payload
  const tokenId = pool.dataProps.depositTokenId
  const preparedTransactions = getPreparedTransactions(
    serializablePreparedTransactions.filter((tx) => !isRegistrationTransaction(tx))
  )
  const tokenInfo = yield* call(getTokenInfo, tokenId)

  if (!tokenInfo) {
    Logger.error(`${TAG}/withdrawSubmitSaga/${mode}`, 'Token info not found for token id', tokenId)
    yield* put(withdrawError())
    return
  }

  const networkId = tokenInfo.networkId
  let submitted = false
  const commonAnalyticsProps = {
    depositTokenId: tokenId,
    networkId,
    poolId: pool.positionId,
    // Exclude tokenAmount for claim-rewards mode
    ...(mode !== 'claim-rewards' && { tokenAmount: amount ?? pool.balance }),
    providerId: pool.appId,
    rewards: rewardsTokens.map(({ tokenId, balance }) => ({
      tokenId,
      amount: balance,
    })),
    mode,
  }

  try {
    Logger.debug(
      `${TAG}/withdrawSubmitSaga/${mode}`,
      `Starting ${mode} for token ${tokenId}, total transactions: ${preparedTransactions.length}`
    )

    const transactionHandlers: Array<
      (transactionHash: string, feeCurrencyId?: string) => BaseStandbyTransaction
    > = []

    if (mode !== 'claim-rewards') {
      const createWithdrawStandbyTxHandler = (
        transactionHash: string,
        feeCurrencyId?: string
      ): BaseStandbyTransaction => ({
        context: newTransactionContext(TAG, 'Earn/Withdraw'),
        networkId,
        type: TokenTransactionTypeV2.EarnWithdraw,
        inAmount: { value: amount ?? pool.balance, tokenId },
        outAmount: { value: amount ?? pool.balance, tokenId: pool.dataProps.withdrawTokenId },
        transactionHash,
        feeCurrencyId,
        providerId: pool.appId,
      })
      transactionHandlers.push(createWithdrawStandbyTxHandler)
    }

    rewardsTokens.forEach(({ balance, tokenId }, index) => {
      const createClaimRewardStandbyTx = (
        transactionHash: string,
        feeCurrencyId?: string
      ): BaseStandbyTransaction => ({
        context: newTransactionContext(TAG, `Earn/ClaimReward-${index + 1}`),
        networkId,
        amount: { value: balance, tokenId },
        type: TokenTransactionTypeV2.EarnClaimReward,
        transactionHash,
        feeCurrencyId,
        providerId: pool.appId,
      })

      if (mode === 'claim-rewards' || !pool.dataProps.withdrawalIncludesClaim) {
        transactionHandlers.push(createClaimRewardStandbyTx)
      }
    })

    const eventStart = EarnEvents.earn_withdraw_submit_start
    AppAnalytics.track(eventStart, commonAnalyticsProps)

    const txHashes = yield* call(
      sendPreparedTransactions,
      serializablePreparedTransactions,
      networkId,
      transactionHandlers,
      isGasSubsidizedForNetwork(networkId)
    )

    Logger.debug(
      `${TAG}/withdrawSubmitSaga/${mode}`,
      `Successfully sent ${mode} transaction(s) to the network`,
      txHashes
    )
    navigateHome()
    submitted = true

    // Wait for transaction receipts
    Logger.debug(`${TAG}/withdrawSubmitSaga/${mode}`, 'Waiting for transaction receipts')
    const txReceipts = yield* all(
      txHashes.map((txHash) => {
        return call([publicClient[networkIdToNetwork[networkId]], 'waitForTransactionReceipt'], {
          hash: txHash,
        })
      })
    )

    txReceipts.forEach((receipt, index) => {
      Logger.debug(
        `${TAG}/withdrawSubmitSaga/${mode}`,
        `Received transaction receipt ${index + 1} of ${txReceipts.length}`,
        receipt
      )
    })

    txReceipts.forEach((receipt, index) => {
      if (receipt.status !== 'success') {
        throw new Error(`Transaction ${index + 1} reverted: ${receipt?.transactionHash}`)
      }
    })

    yield* put(withdrawSuccess())
    AppAnalytics.track(EarnEvents.earn_withdraw_submit_success, commonAnalyticsProps)
  } catch (err) {
    if (err === CANCELLED_PIN_INPUT) {
      Logger.info(`${TAG}/withdrawSubmitSaga/${mode}`, 'Transaction(s) cancelled by user')
      yield* put(withdrawCancel())
      AppAnalytics.track(EarnEvents.earn_withdraw_submit_cancel, commonAnalyticsProps)
      return
    }

    const error = ensureError(err)
    Logger.error(`${TAG}/withdrawSubmitSaga/${mode}`, `Error sending ${mode} transaction(s)`, error)
    yield* put(withdrawError())
    AppAnalytics.track(EarnEvents.earn_withdraw_submit_error, {
      ...commonAnalyticsProps,
      error: error.message,
    })

    if (!submitted) {
      vibrateError()
    }
  }
}

export function* earnSaga() {
  yield* takeLeading(depositStart.type, safely(depositSubmitSaga))
  yield* takeLeading(withdrawStart.type, safely(withdrawSubmitSaga))
}
