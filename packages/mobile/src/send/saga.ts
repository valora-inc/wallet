import BigNumber from 'bignumber.js'
import { call, put, select, spawn, take, takeLeading } from 'redux-saga/effects'
import { giveProfileAccess } from 'src/account/profileInfo'
import { showErrorOrFallback } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { calculateFee, FeeInfo } from 'src/fees/saga'
import { transferGoldToken } from 'src/goldToken/actions'
import { encryptComment } from 'src/identity/commentEncryption'
import { e164NumberToAddressSelector } from 'src/identity/reducer'
import { sendInvite } from 'src/invite/saga'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { completePaymentRequest } from 'src/paymentRequest/actions'
import { handleBarcode, shareSVGImage } from 'src/qrcode/utils'
import { recipientHasNumber, RecipientInfo } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import {
  Actions,
  HandleBarcodeDetectedAction,
  SendPaymentOrInviteAction,
  sendPaymentOrInviteFailure,
  sendPaymentOrInviteSuccess,
  ShareQRCodeAction,
} from 'src/send/actions'
import { transferStableToken } from 'src/stableToken/actions'
import {
  BasicTokenTransfer,
  createTokenTransferTransaction,
  getCurrencyAddress,
} from 'src/tokens/saga'
import { newTransactionContext } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getRegisterDekTxGas } from 'src/web3/dataEncryptionKey'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { estimateGas } from 'src/web3/utils'

const TAG = 'send/saga'

// All observed cUSD and CELO transfers take less than 200000 gas.
export const STATIC_SEND_TOKEN_GAS_ESTIMATE = 200000

export async function getSendTxGas(
  account: string,
  currency: Currency,
  params: BasicTokenTransfer,
  useStatic: boolean = true
): Promise<BigNumber> {
  if (useStatic) {
    Logger.debug(`${TAG}/getSendTxGas`, `Using static gas of ${STATIC_SEND_TOKEN_GAS_ESTIMATE}`)
    return new BigNumber(STATIC_SEND_TOKEN_GAS_ESTIMATE)
  }

  try {
    Logger.debug(`${TAG}/getSendTxGas`, 'Getting gas estimate for send tx')
    const tx = await createTokenTransferTransaction(currency, params)
    const txParams = {
      from: account,
      feeCurrency: currency === Currency.Celo ? undefined : await getCurrencyAddress(currency),
    }
    const gas = await estimateGas(tx.txo, txParams)
    Logger.debug(`${TAG}/getSendTxGas`, `Estimated gas of ${gas.toString()}`)
    return gas
  } catch (error) {
    Logger.error(`${TAG}/getSendTxGas`, 'Error', error)
    throw error
  }
}

export async function getSendFee(
  account: string,
  currency: Currency,
  params: BasicTokenTransfer,
  includeDekFee: boolean = false,
  balance: string
) {
  try {
    if (new BigNumber(params.amount).isGreaterThan(new BigNumber(balance))) {
      throw new Error(ErrorMessages.INSUFFICIENT_BALANCE)
    }

    let gas = await getSendTxGas(account, currency, params)
    if (includeDekFee) {
      const dekGas = await getRegisterDekTxGas(account, currency)
      gas = gas.plus(dekGas)
    }

    return calculateFee(gas, currency)
  } catch (error) {
    throw error
  }
}

export function* watchQrCodeDetections() {
  while (true) {
    const action: HandleBarcodeDetectedAction = yield take(Actions.BARCODE_DETECTED)
    Logger.debug(TAG, 'Barcode detected in watcher')
    const recipientInfo: RecipientInfo = yield select(recipientInfoSelector)

    const e164NumberToAddress = yield select(e164NumberToAddressSelector)
    const isOutgoingPaymentRequest = action.isOutgoingPaymentRequest
    let secureSendTxData
    let requesterAddress

    if (action.scanIsForSecureSend) {
      secureSendTxData = action.transactionData
      requesterAddress = action.requesterAddress
    }

    try {
      yield call(
        handleBarcode,
        action.data,
        e164NumberToAddress,
        recipientInfo,
        secureSendTxData,
        isOutgoingPaymentRequest,
        requesterAddress
      )
    } catch (error) {
      Logger.error(TAG, 'Error handling the barcode', error)
    }
  }
}

export function* watchQrCodeShare() {
  while (true) {
    const action: ShareQRCodeAction = yield take(Actions.QRCODE_SHARE)
    try {
      const result = yield call(shareSVGImage, action.qrCodeSvg)
      // Note: when user cancels the share sheet, result contains {"dismissedAction":true}
      Logger.info(TAG, 'Share done', JSON.stringify(result))
    } catch (error) {
      Logger.error(TAG, 'Error sharing qr code', error)
    }
  }
}

function* sendPayment(
  recipientAddress: string,
  amount: BigNumber,
  comment: string,
  currency: Currency,
  feeInfo?: FeeInfo
) {
  try {
    ValoraAnalytics.track(SendEvents.send_tx_start)

    const ownAddress: string = yield select(currentAccountSelector)
    const encryptedComment = yield call(encryptComment, comment, recipientAddress, ownAddress, true)

    const context = newTransactionContext(TAG, 'Send payment')
    switch (currency) {
      case Currency.Celo: {
        yield put(
          transferGoldToken({
            recipientAddress,
            amount: amount.toString(),
            currency,
            comment: encryptedComment,
            feeInfo,
            context,
          })
        )
        break
      }
      case Currency.Dollar:
      case Currency.Euro: {
        yield put(
          transferStableToken({
            recipientAddress,
            amount: amount.toString(),
            currency,
            comment: encryptedComment,
            feeInfo,
            context,
          })
        )
        break
      }
      default: {
        throw new Error(`Sending currency ${currency} not yet supported`)
      }
    }
    ValoraAnalytics.track(SendEvents.send_tx_complete, {
      txId: context.id,
      recipientAddress,
      amount: amount.toString(),
      currency,
    })
    yield call(giveProfileAccess, recipientAddress)
  } catch (error) {
    Logger.error(`${TAG}/sendPayment`, 'Could not send payment', error)
    ValoraAnalytics.track(SendEvents.send_tx_error, { error: error.message })
    throw error
  }
}

export function* sendPaymentOrInviteSaga({
  amount,
  currency,
  comment,
  recipient,
  recipientAddress,
  feeInfo,
  firebasePendingRequestUid,
  fromModal,
}: SendPaymentOrInviteAction) {
  try {
    yield call(getConnectedUnlockedAccount)

    if (recipientAddress) {
      yield call(sendPayment, recipientAddress, amount, comment, currency, feeInfo)
    } else if (recipientHasNumber(recipient)) {
      yield call(sendInvite, recipient.e164PhoneNumber, amount, currency, feeInfo)
    }

    if (firebasePendingRequestUid) {
      yield put(completePaymentRequest(firebasePendingRequestUid))
    }

    if (fromModal) {
      navigateBack()
    } else {
      navigateHome()
    }

    yield put(sendPaymentOrInviteSuccess(amount))
  } catch (e) {
    yield put(showErrorOrFallback(e, ErrorMessages.SEND_PAYMENT_FAILED))
    yield put(sendPaymentOrInviteFailure())
  }
}

export function* watchSendPaymentOrInvite() {
  yield takeLeading(Actions.SEND_PAYMENT_OR_INVITE, sendPaymentOrInviteSaga)
}

export function* sendSaga() {
  yield spawn(watchQrCodeDetections)
  yield spawn(watchQrCodeShare)
  yield spawn(watchSendPaymentOrInvite)
}
