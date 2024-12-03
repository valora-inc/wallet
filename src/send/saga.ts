import { showErrorOrFallback } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { CeloExchangeEvents, SendEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { handleQRCodeDefault, handleQRCodeSecureSend, shareSVGImage } from 'src/qrcode/utils'
import {
  Actions,
  SendPaymentAction,
  ShareQRCodeAction,
  sendPaymentFailure,
  sendPaymentSuccess,
} from 'src/send/actions'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { getTokenInfo } from 'src/tokens/saga'
import { BaseStandbyTransaction } from 'src/transactions/slice'
import { TokenTransactionTypeV2, newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import { sendPreparedTransactions } from 'src/viem/saga'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { call, put, spawn, take, takeEvery, takeLeading } from 'typed-redux-saga'

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

export function* sendPaymentSaga({
  amount,
  tokenId,
  usdAmount,
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
      type: TokenTransactionTypeV2.Sent,
      context,
      networkId: tokenInfo.networkId,
      amount: {
        value: amount.negated().toString(),
        tokenAddress: tokenInfo.address ?? undefined,
        tokenId,
      },
      address: recipientAddress,
      metadata: {},
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

function* watchSendPayment() {
  yield* takeLeading(Actions.SEND_PAYMENT, safely(sendPaymentSaga))
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
}
