import { CeloTransactionObject, Contract, toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { CeloTokenWrapper } from '@celo/contractkit/lib/wrappers/CeloTokenWrapper'
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
  SendPaymentOrInviteActionLegacy,
  sendPaymentOrInviteFailure,
  sendPaymentOrInviteSuccess,
  ShareQRCodeAction,
} from 'src/send/actions'
import { transferStableToken } from 'src/stableToken/actions'
import { TokenBalance } from 'src/tokens/reducer'
import {
  BasicTokenTransfer,
  createTokenTransferTransaction,
  getCurrencyAddress,
  getERC20TokenContract,
  getTokenContractFromAddress,
  tokenAmountInSmallestUnit,
} from 'src/tokens/saga'
import { tokensByCurrencySelector } from 'src/tokens/selectors'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { newTransactionContext } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getRegisterDekTxGas } from 'src/web3/dataEncryptionKey'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { estimateGas } from 'src/web3/utils'
import * as utf8 from 'utf8'

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

function* sendPaymentLegacy(
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
      tokenAddress: currency,
      usdAmount: '',
    })
    yield call(giveProfileAccess, recipientAddress)
  } catch (error) {
    Logger.error(`${TAG}/sendPaymentLegacy`, 'Could not send payment', error.message)
    ValoraAnalytics.track(SendEvents.send_tx_error, { error: error.message })
    throw error
  }
}

function* buildSendTx(
  tokenAddress: string,
  amount: BigNumber,
  recipientAddress: string,
  comment: string
) {
  const contract: Contract = yield call(getERC20TokenContract, tokenAddress)
  const coreContract: CeloTokenWrapper<any> | undefined = yield call(
    getTokenContractFromAddress,
    tokenAddress
  )
  const convertedAmount: string = yield call(tokenAmountInSmallestUnit, amount, tokenAddress)

  const kit: ContractKit = yield call(getContractKit)
  return coreContract
    ? coreContract.transferWithComment(recipientAddress, convertedAmount, utf8.encode(comment))
    : toTransactionObject(
        kit.connection,
        contract.methods.transfer(recipientAddress, convertedAmount)
      )
}

function* sendPayment(
  recipientAddress: string,
  amount: BigNumber,
  amountInLocalCurrency: BigNumber,
  usdAmount: BigNumber,
  tokenAddress: string,
  comment: string,
  feeInfo?: FeeInfo
) {
  const context = newTransactionContext(TAG, 'Send payment')

  try {
    ValoraAnalytics.track(SendEvents.send_tx_start)

    const userAddress: string = yield call(getConnectedUnlockedAccount)

    const encryptedComment: string = yield call(
      encryptComment,
      comment,
      recipientAddress,
      userAddress,
      true
    )

    Logger.debug(
      TAG,
      'Transferring token',
      context.description ?? 'No description',
      context.id,
      tokenAddress,
      amount,
      feeInfo ? JSON.stringify(feeInfo) : 'undefined'
    )

    // TODO: Add temporary tx to feed.
    // yield put(
    //   addStandbyTransaction({
    //     context,
    //     type: TokenTransactionType.Sent,
    //     comment,
    //     status: TransactionStatus.Pending,
    //     value: amount.toString(),
    //     tokenAddress,
    //     timestamp: Math.floor(Date.now() / 1000),
    //     address: recipientAddress,
    //   })
    // )

    const tx: CeloTransactionObject<boolean> = yield call(
      buildSendTx,
      tokenAddress,
      amount,
      recipientAddress,
      encryptedComment
    )

    yield call(
      sendAndMonitorTransaction,
      tx,
      userAddress,
      context,
      undefined,
      feeInfo?.currency,
      feeInfo?.gas?.toNumber(),
      feeInfo?.gasPrice
    )

    ValoraAnalytics.track(SendEvents.send_tx_complete, {
      txId: context.id,
      recipientAddress,
      amount: amount.toString(),
      usdAmount: usdAmount.toString(),
      tokenAddress,
    })
    yield call(giveProfileAccess, recipientAddress)
  } catch (error) {
    Logger.error(`${TAG}/sendPayment`, 'Could not make token transfer', error.message)
    ValoraAnalytics.track(SendEvents.send_tx_error, { error: error.message })
    yield put(showErrorOrFallback(error, ErrorMessages.TRANSACTION_FAILED))
    // TODO: Uncomment this when the transaction feed supports multiple tokens.
    // yield put(removeStandbyTransaction(context.id))
  }
}

export function* sendPaymentOrInviteSagaLegacy({
  amount,
  currency,
  comment,
  recipient,
  recipientAddress,
  feeInfo,
  firebasePendingRequestUid,
  fromModal,
}: SendPaymentOrInviteActionLegacy) {
  try {
    yield call(getConnectedUnlockedAccount)
    const tokenByCurrency: Record<Currency, TokenBalance | undefined> = yield select(
      tokensByCurrencySelector
    )
    const tokenInfo = tokenByCurrency[currency]
    if (!tokenInfo) {
      throw new Error(`No token info found for ${currency}`)
    }

    if (recipientAddress) {
      yield call(sendPaymentLegacy, recipientAddress, amount, comment, currency, feeInfo)
    } else if (recipientHasNumber(recipient)) {
      yield call(
        sendInvite,
        recipient.e164PhoneNumber,
        amount,
        amount.multipliedBy(tokenInfo.usdPrice),
        tokenInfo.address,
        feeInfo
      )
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

export function* watchSendPaymentOrInviteLegacy() {
  yield takeLeading(Actions.SEND_PAYMENT_OR_INVITE_LEGACY, sendPaymentOrInviteSagaLegacy)
}

export function* sendPaymentOrInviteSaga({
  amount,
  tokenAddress,
  amountInLocalCurrency,
  usdAmount,
  comment,
  recipient,
  feeInfo,
  fromModal,
}: SendPaymentOrInviteAction) {
  try {
    yield call(getConnectedUnlockedAccount)
    if (recipient.address) {
      yield call(
        sendPayment,
        recipient.address,
        amount,
        amountInLocalCurrency,
        usdAmount,
        tokenAddress,
        comment,
        feeInfo
      )
    } else if (recipientHasNumber(recipient)) {
      yield call(sendInvite, recipient.e164PhoneNumber, amount, usdAmount, tokenAddress, feeInfo)
    } else {
      throw new Error('')
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
  yield spawn(watchSendPaymentOrInviteLegacy)
}
