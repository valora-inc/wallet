import { PayloadAction } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import erc20 from 'src/abis/IERC20'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { depositCancel, depositError, depositStart, depositSuccess } from 'src/earn/slice'
import { DepositInfo } from 'src/earn/types'
import { navigateHome } from 'src/navigator/NavigationService'
import { CANCELLED_PIN_INPUT } from 'src/pincode/authentication'
import { vibrateError } from 'src/styles/hapticFeedback'
import { getTokenInfo } from 'src/tokens/saga'
import { BaseStandbyTransaction } from 'src/transactions/actions'
import { TokenTransactionTypeV2, newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import { getPreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { sendPreparedTransactions } from 'src/viem/saga'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { all, call, put, takeLeading } from 'typed-redux-saga'
import { decodeFunctionData } from 'viem'

const TAG = 'earn/saga'

export function* depositSubmitSaga(action: PayloadAction<DepositInfo>) {
  const { tokenId, preparedTransactions: serializablePreparedTransactions, amount } = action.payload

  const preparedTransactions = getPreparedTransactions(serializablePreparedTransactions)

  const tokenInfo = yield* call(getTokenInfo, tokenId)
  if (!tokenInfo) {
    Logger.error(`${TAG}/depositSubmitSaga`, 'Token info not found for token id', tokenId)
    yield* put(depositError())
    return
  }

  const networkId = tokenInfo.networkId
  const trackedProperties = {
    tokenId,
    networkId,
    tokenAmount: amount,
    providerId: 'aave-v3',
  }

  let submitted = false

  try {
    Logger.debug(
      `${TAG}/depositSubmitSaga`,
      `Starting deposit for token ${tokenId}, total transactions: ${preparedTransactions.length}`
    )

    const createDepositStandbyTxHandlers = []

    if (preparedTransactions.length > 1 && preparedTransactions[0].data) {
      const { functionName, args } = yield* call(decodeFunctionData, {
        abi: erc20.abi,
        data: preparedTransactions[0].data,
      })
      if (functionName === 'approve' && preparedTransactions[0].to === tokenInfo.address && args) {
        Logger.debug(`${TAG}/depositSubmitSaga`, 'First transaction is an approval transaction')
        const approvedAmountInSmallestUnit = args[1] as bigint
        const approvedAmount = new BigNumber(approvedAmountInSmallestUnit.toString())
          .shiftedBy(-tokenInfo.decimals)
          .toString()

        const createApprovalStandbyTx = (
          transactionHash: string,
          feeCurrencyId?: string
        ): BaseStandbyTransaction => {
          return {
            context: newTransactionContext(TAG, 'Earn/Approve'),
            __typename: 'TokenApproval',
            networkId,
            type: TokenTransactionTypeV2.Approval,
            transactionHash,
            tokenId,
            approvedAmount,
            feeCurrencyId,
          }
        }
        createDepositStandbyTxHandlers.push(createApprovalStandbyTx)
      }
    }

    // this is a placeholder for now, should be updated to a "deposit" transaction type
    const createDepositStandbyTx = (
      transactionHash: string,
      feeCurrencyId?: string
    ): BaseStandbyTransaction => {
      return {
        context: newTransactionContext(TAG, 'Earn/Deposit'),
        __typename: 'TokenExchangeV3',
        networkId,
        type: TokenTransactionTypeV2.SwapTransaction,
        inAmount: {
          value: amount,
          tokenId: networkConfig.aaveArbUsdcTokenId,
        },
        outAmount: {
          value: amount,
          tokenId,
        },
        transactionHash,
        feeCurrencyId,
      }
    }
    createDepositStandbyTxHandlers.push(createDepositStandbyTx)

    ValoraAnalytics.track(EarnEvents.earn_deposit_submit_start, trackedProperties)

    const txHashes = yield* call(
      sendPreparedTransactions,
      serializablePreparedTransactions,
      networkId,
      createDepositStandbyTxHandlers
    )

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
        return call([publicClient[networkIdToNetwork[networkId]], 'waitForTransactionReceipt'], {
          hash: txHash,
        })
      })
    )
    txReceipts.forEach((receipt, index) => {
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

    ValoraAnalytics.track(EarnEvents.earn_deposit_submit_success, trackedProperties)
    yield* put(depositSuccess())
  } catch (err) {
    if (err === CANCELLED_PIN_INPUT) {
      Logger.info(`${TAG}/depositSubmitSaga`, 'Transaction cancelled by user')
      yield* put(depositCancel())
      ValoraAnalytics.track(EarnEvents.earn_deposit_submit_cancel, trackedProperties)
      return
    }

    const error = ensureError(err)
    Logger.error(`${TAG}/depositSubmitSaga`, 'Error sending deposit transaction', error)
    yield* put(depositError())
    ValoraAnalytics.track(EarnEvents.earn_deposit_submit_error, {
      ...trackedProperties,
      error: error.message,
    })

    // Only vibrate if we haven't already submitted the transaction
    // since the user may be doing something else on the app by now
    if (!submitted) {
      vibrateError()
    }
  }
}

export function* earnSaga() {
  yield* takeLeading(depositStart.type, safely(depositSubmitSaga))
}
