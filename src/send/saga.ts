import { Contract, toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { showErrorOrFallback } from 'src/alert/actions'
import { CeloExchangeEvents, SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { FeeInfo } from 'src/fees/saga'
import { encryptComment } from 'src/identity/commentEncryption'
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
import {
  getERC20TokenContract,
  getStableTokenContract,
  getTokenInfo,
  getTokenInfoByAddress,
  tokenAmountInSmallestUnit,
} from 'src/tokens/saga'
import { TokenBalance } from 'src/tokens/slice'
import { getTokenId } from 'src/tokens/utils'
import { addStandbyTransaction } from 'src/transactions/actions'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import {
  TokenTransactionTypeV2,
  TransactionContext,
  newTransactionContext,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { sendPayment as viemSendPayment } from 'src/viem/saga'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { call, put, spawn, take, takeEvery, takeLeading } from 'typed-redux-saga'
import * as utf8 from 'utf8'

const TAG = 'send/saga'

export function* watchQrCodeShare() {
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

/**
 * Sends a payment to an address with an encrypted comment
 *
 * @param context the transaction context
 * @param recipientAddress the address to send the payment to
 * @param amount the crypto amount to send
 * @param tokenAddress the crypto token address
 * @param comment the comment on the transaction
 * @param feeInfo an object containing the fee information
 */
export function* buildAndSendPayment(
  context: TransactionContext,
  recipientAddress: string,
  amount: BigNumber,
  tokenAddress: string,
  comment: string,
  feeInfo: FeeInfo
) {
  const userAddress: string = yield* call(getConnectedUnlockedAccount)

  const encryptedComment = yield* call(encryptComment, comment, recipientAddress, userAddress, true)

  Logger.debug(
    TAG,
    'Transferring token',
    context.description ?? 'No description',
    context.id,
    tokenAddress,
    amount,
    feeInfo
  )

  const networkId = networkConfig.defaultNetworkId

  yield* put(
    addStandbyTransaction({
      __typename: 'TokenTransferV3',
      type: TokenTransactionTypeV2.Sent,
      context,
      networkId,
      amount: {
        value: amount.negated().toString(),
        tokenAddress,
        tokenId: getTokenId(networkConfig.defaultNetworkId, tokenAddress),
      },
      address: recipientAddress,
      metadata: {
        comment,
      },
    })
  )

  const tx = yield* call(
    buildSendTx,
    tokenAddress,
    amount,
    recipientAddress,
    encryptedComment || ''
  )

  const { receipt, error } = yield* call(
    sendAndMonitorTransaction,
    tx,
    userAddress,
    context,
    feeInfo.feeCurrency,
    feeInfo.gas ? Number(feeInfo.gas) : undefined,
    feeInfo.gasPrice
  )

  return { receipt, error }
}

/**
 * Sends a payment to an address with an encrypted comment and gives profile
 * access to the recipient
 *
 * @param recipientAddress the address to send the payment to
 * @param amount the crypto amount to send
 * @param usdAmount the amount in usd (nullable, used only for analytics)
 * @param tokenId the id of the token being sent
 * @param comment the comment on the transaction
 * @param feeInfo an object containing the fee information
 * @param preparedTransaction a serialized viem tx request
 */
function* sendPayment(
  recipientAddress: string,
  amount: BigNumber,
  usdAmount: BigNumber | null,
  tokenId: string,
  comment: string,
  feeInfo?: FeeInfo,
  preparedTransaction?: SerializableTransactionRequest
) {
  const context = newTransactionContext(TAG, 'Send payment')
  const tokenInfo = yield* call(getTokenInfo, tokenId)
  if (!tokenInfo) {
    throw new Error('token info not found')
  }

  try {
    ValoraAnalytics.track(SendEvents.send_tx_start)
    yield* call(viemSendPayment, {
      context,
      recipientAddress,
      amount,
      tokenId,
      comment,
      feeInfo,
      preparedTransaction,
    })

    ValoraAnalytics.track(SendEvents.send_tx_complete, {
      txId: context.id,
      recipientAddress,
      amount: amount.toString(),
      usdAmount: usdAmount?.toString(),
      tokenAddress: tokenInfo.address ?? undefined,
      tokenId: tokenInfo.tokenId,
      networkId: tokenInfo.networkId,
      isTokenManuallyImported: !!tokenInfo?.isManuallyImported,
    })
  } catch (err) {
    const error = ensureError(err)
    Logger.error(`${TAG}/sendPayment`, 'Could not make token transfer', error.message)
    ValoraAnalytics.track(SendEvents.send_tx_error, { error: error.message })
    yield* put(showErrorOrFallback(error, ErrorMessages.TRANSACTION_FAILED))
    // TODO: Uncomment this when the transaction feed supports multiple tokens.
    // yield put(removeStandbyTransaction(context.id))
  }
}

export function* sendPaymentSaga({
  amount,
  tokenId,
  usdAmount,
  comment,
  recipient,
  fromModal,
  feeInfo,
  preparedTransaction,
}: SendPaymentAction) {
  try {
    yield* call(getConnectedUnlockedAccount)
    SentryTransactionHub.startTransaction(SentryTransaction.send_payment)
    const tokenInfo: TokenBalance | undefined = yield* call(getTokenInfo, tokenId)
    if (recipient.address) {
      yield* call(
        sendPayment,
        recipient.address,
        amount,
        usdAmount,
        tokenId,
        comment,
        feeInfo,
        preparedTransaction
      )
      if (tokenInfo?.symbol === 'CELO') {
        ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_completed, {
          amount: amount.toString(),
        })
      }
    } else {
      throw new Error('No address found on recipient')
    }

    if (fromModal) {
      navigateBack()
    } else {
      navigateHome()
    }

    yield* put(sendPaymentSuccess({ amount, tokenId }))
    SentryTransactionHub.finishTransaction(SentryTransaction.send_payment)
  } catch (e) {
    yield* put(showErrorOrFallback(e, ErrorMessages.SEND_PAYMENT_FAILED))
    yield* put(sendPaymentFailure())
  }
}

export function* watchSendPayment() {
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
