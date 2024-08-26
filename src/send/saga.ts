import { Contract, toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { showErrorOrFallback } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { CeloExchangeEvents, SendEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { encryptComment } from 'src/identity/commentEncryption'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { handleQRCodeDefault, handleQRCodeSecureSend, shareSVGImage } from 'src/qrcode/utils'
import {
  Actions,
  EncryptCommentAction,
  SendPaymentAction,
  ShareQRCodeAction,
  encryptCommentComplete,
  sendPaymentFailure,
  sendPaymentSuccess,
} from 'src/send/actions'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import {
  getERC20TokenContract,
  getStableTokenContract,
  getTokenInfo,
  getTokenInfoByAddress,
  tokenAmountInSmallestUnit,
} from 'src/tokens/saga'
import { TokenBalance, fetchTokenBalances } from 'src/tokens/slice'
import { BaseStandbyTransaction } from 'src/transactions/actions'
import { TokenTransactionTypeV2, newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import { sendPreparedTransactions } from 'src/viem/saga'
import { getContractKit } from 'src/web3/contracts'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { call, put, spawn, take, takeEvery, takeLeading } from 'typed-redux-saga'
import * as utf8 from 'utf8'

export const TAG = 'send/saga'

function* watchQrCodeShare() {
  while (true) {
    const action = (yield* take(Actions.QRCODE_SHARE)) as ShareQRCodeAction
    try {
      const result = yield* call(shareSVGImage, action.qrCodeSvg)
      // Note: when user cancels the share sheet, result contains {"dismissedAction":true}
      Logger.info(TAG, 'Share done', result)
    } catch (error) {
      Logger.error(TAG, 'Error sharing qr code', error)
    }
  }
}

export function* buildSendTx(
  tokenAddress: string,
  amount: BigNumber,
  recipientAddress: string,
  comment: string
) {
  const contract: Contract = yield* call(getERC20TokenContract, tokenAddress)
  const coreContract: Contract = yield* call(getStableTokenContract, tokenAddress)

  const tokenInfo: TokenBalance | undefined = yield* call(getTokenInfoByAddress, tokenAddress)
  if (!tokenInfo) {
    throw new Error(`Could not find token with address ${tokenAddress}`)
  }
  const convertedAmount = tokenAmountInSmallestUnit(amount, tokenInfo.decimals)

  const kit: ContractKit = yield* call(getContractKit)
  return toTransactionObject(
    kit.connection,
    tokenInfo?.canTransferWithComment && tokenInfo.symbol !== 'CELO'
      ? coreContract.methods.transferWithComment(
          recipientAddress,
          convertedAmount,
          utf8.encode(comment)
        )
      : contract.methods.transfer(recipientAddress, convertedAmount)
  )
}

export function* sendPaymentSaga({
  amount,
  tokenId,
  usdAmount,
  comment,
  recipient,
  fromModal,
  preparedTransaction: serializablePreparedTransaction,
}: SendPaymentAction) {
  try {
    SentryTransactionHub.startTransaction(SentryTransaction.send_payment)
    const context = newTransactionContext(TAG, 'Send payment')
    const recipientAddress = recipient.address
    if (!recipientAddress) {
      // should never happen. TODO(ACT-1046): ensure recipient type here
      // includes address
      throw new Error('No address found on recipient')
    }

    const tokenInfo = yield* call(getTokenInfo, tokenId)
    if (!tokenInfo) {
      throw new Error(`Could not find token info for token id: ${tokenId}`)
    }

    const createStandbyTransaction = (
      transactionHash: string,
      feeCurrencyId?: string
    ): BaseStandbyTransaction => ({
      __typename: 'TokenTransferV3',
      type: TokenTransactionTypeV2.Sent,
      context,
      networkId: tokenInfo.networkId,
      amount: {
        value: amount.negated().toString(),
        tokenAddress: tokenInfo.address ?? undefined,
        tokenId,
      },
      address: recipientAddress,
      metadata: {
        comment,
      },
      transactionHash,
      feeCurrencyId,
    })

    AppAnalytics.track(SendEvents.send_tx_start)
    Logger.debug(
      `${TAG}/sendPaymentSaga`,
      'Executing send transaction',
      context.description ?? 'No description',
      context.id,
      tokenId,
      amount
    )

    const [hash] = yield* call(
      sendPreparedTransactions,
      [serializablePreparedTransaction],
      tokenInfo.networkId,
      [createStandbyTransaction]
    )

    const receipt = yield* call(
      [publicClient[networkIdToNetwork[tokenInfo.networkId]], 'waitForTransactionReceipt'],
      { hash }
    )
    Logger.debug(`${TAG}/sendPaymentSaga`, 'Got send transaction receipt', receipt)
    if (receipt.status === 'reverted') {
      throw new Error(`Send transaction reverted: ${hash}`)
    }

    yield* put(fetchTokenBalances({ showLoading: true }))

    AppAnalytics.track(SendEvents.send_tx_complete, {
      txId: context.id,
      recipientAddress,
      amount: amount.toString(),
      usdAmount: usdAmount?.toString(),
      tokenAddress: tokenInfo.address ?? undefined,
      tokenId: tokenInfo.tokenId,
      networkId: tokenInfo.networkId,
      isTokenManuallyImported: !!tokenInfo?.isManuallyImported,
    })

    if (tokenInfo?.symbol === 'CELO') {
      AppAnalytics.track(CeloExchangeEvents.celo_withdraw_completed, {
        amount: amount.toString(),
      })
    }

    if (fromModal) {
      navigateBack()
    } else {
      navigateHome()
    }

    yield* put(sendPaymentSuccess({ amount, tokenId }))
    SentryTransactionHub.finishTransaction(SentryTransaction.send_payment)
  } catch (err) {
    // for pin cancelled, this will show the pin input canceled message, for any
    // other error, will fallback to payment failed
    yield* put(showErrorOrFallback(err, ErrorMessages.SEND_PAYMENT_FAILED))
    yield* put(sendPaymentFailure()) // resets isSending state
    const error = ensureError(err)
    if (error.message === ErrorMessages.PIN_INPUT_CANCELED) {
      Logger.info(`${TAG}/sendPaymentSaga`, 'Send cancelled by user')
      return
    }
    Logger.error(`${TAG}/sendPaymentSaga`, 'Send payment failed', error)
    AppAnalytics.track(SendEvents.send_tx_error, { error: error.message })
  } finally {
    SentryTransactionHub.finishTransaction(SentryTransaction.send_payment)
  }
}

export function* encryptCommentSaga({ comment, fromAddress, toAddress }: EncryptCommentAction) {
  const encryptedComment = comment
    ? yield* call(encryptComment, comment, toAddress, fromAddress)
    : null
  yield* put(encryptCommentComplete(encryptedComment))
}

function* watchSendPayment() {
  yield* takeLeading(Actions.SEND_PAYMENT, safely(sendPaymentSaga))
}

function* watchEncryptComment() {
  yield* takeLeading(Actions.ENCRYPT_COMMENT, safely(encryptCommentSaga))
}

function* watchQrCodeDetections() {
  yield* takeEvery(Actions.BARCODE_DETECTED, safely(handleQRCodeDefault))
}

function* watchQrCodeDetectionsSecureSend() {
  yield* takeEvery(Actions.BARCODE_DETECTED_SECURE_SEND, safely(handleQRCodeSecureSend))
}

export function* sendSaga() {
  yield* spawn(watchQrCodeDetectionsSecureSend)
  yield* spawn(watchQrCodeDetections)
  yield* spawn(watchQrCodeShare)
  yield* spawn(watchSendPayment)
  yield* spawn(watchEncryptComment)
}
