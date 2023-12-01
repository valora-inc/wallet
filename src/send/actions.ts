import BigNumber from 'bignumber.js'
import { FeeInfo } from 'src/fees/saga'
import { Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { Currency } from 'src/utils/currencies'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { Svg } from 'svgs'

export interface QrCode {
  type: string
  data: string
}

export type SVG = typeof Svg

export enum Actions {
  BARCODE_DETECTED = 'SEND/BARCODE_DETECTED',
  BARCODE_DETECTED_SECURE_SEND = 'SEND/BARCODE_DETECTED_SECURE_SEND',
  QRCODE_SHARE = 'SEND/QRCODE_SHARE',
  SEND_PAYMENT = 'SEND/SEND_PAYMENT',
  SEND_PAYMENT_SUCCESS = 'SEND/SEND_PAYMENT_SUCCESS',
  SEND_PAYMENT_FAILURE = 'SEND/SEND_PAYMENT_FAILURE',
  UPDATE_LAST_USED_CURRENCY = 'SEND/UPDATE_LAST_USED_CURRENCY',
  SET_SHOW_WARNING = 'SEND/SHOW_WARNING',
}

export interface HandleQRCodeDetectedAction {
  type: Actions.BARCODE_DETECTED
  data: QrCode
}

export interface HandleQRCodeDetectedSecureSendAction {
  type: Actions.BARCODE_DETECTED_SECURE_SEND
  data: QrCode
  transactionData: TransactionDataInput
  requesterAddress?: string
}

export interface ShareQRCodeAction {
  type: Actions.QRCODE_SHARE
  qrCodeSvg: SVG
}

export interface SendPaymentAction {
  type: Actions.SEND_PAYMENT
  amount: BigNumber
  tokenId: string
  usdAmount: BigNumber | null
  comment: string
  recipient: Recipient
  fromModal: boolean
  feeInfo?: FeeInfo
  preparedTransaction?: SerializableTransactionRequest
}

export interface SendPaymentSuccessAction {
  type: Actions.SEND_PAYMENT_SUCCESS
  amount: BigNumber
  tokenId: string
}

export interface SendPaymentFailureAction {
  type: Actions.SEND_PAYMENT_FAILURE
}

export interface UpdateLastUsedCurrencyAction {
  type: Actions.UPDATE_LAST_USED_CURRENCY
  currency: Currency
}

export interface SetShowWarningAction {
  type: Actions.SET_SHOW_WARNING
  showWarning: boolean
}

export type ActionTypes =
  | HandleQRCodeDetectedAction
  | HandleQRCodeDetectedSecureSendAction
  | ShareQRCodeAction
  | SendPaymentAction
  | SendPaymentSuccessAction
  | SendPaymentFailureAction
  | UpdateLastUsedCurrencyAction
  | SetShowWarningAction

export const handleQRCodeDetected = (data: QrCode): HandleQRCodeDetectedAction => ({
  type: Actions.BARCODE_DETECTED,
  data,
})

export const handleQRCodeDetectedSecureSend = (
  data: QrCode,
  transactionData: TransactionDataInput,
  requesterAddress?: string
): HandleQRCodeDetectedSecureSendAction => ({
  type: Actions.BARCODE_DETECTED_SECURE_SEND,
  data,
  transactionData,
  requesterAddress,
})

export const shareQRCode = (qrCodeSvg: SVG): ShareQRCodeAction => ({
  type: Actions.QRCODE_SHARE,
  qrCodeSvg,
})

export const sendPayment = (
  amount: BigNumber,
  tokenId: string,
  usdAmount: BigNumber | null,
  comment: string,
  recipient: Recipient,
  fromModal: boolean,
  feeInfo?: FeeInfo,
  preparedTransaction?: SerializableTransactionRequest
): SendPaymentAction => ({
  type: Actions.SEND_PAYMENT,
  amount,
  tokenId,
  usdAmount,
  comment,
  recipient,
  fromModal,
  feeInfo,
  preparedTransaction,
})

export const sendPaymentSuccess = ({
  amount,
  tokenId,
}: {
  amount: BigNumber
  tokenId: string
}): SendPaymentSuccessAction => ({
  type: Actions.SEND_PAYMENT_SUCCESS,
  amount,
  tokenId,
})

export const sendPaymentFailure = (): SendPaymentFailureAction => ({
  type: Actions.SEND_PAYMENT_FAILURE,
})

export const updateLastUsedCurrency = (currency: Currency): UpdateLastUsedCurrencyAction => ({
  type: Actions.UPDATE_LAST_USED_CURRENCY,
  currency,
})

export const setShowWarning = (showWarning: boolean): SetShowWarningAction => ({
  type: Actions.SET_SHOW_WARNING,
  showWarning,
})
