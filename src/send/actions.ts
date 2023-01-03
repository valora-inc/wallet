import BigNumber from 'bignumber.js'
import { FeeInfo } from 'src/fees/saga'
import { Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { TransactionDataInput as TransactionDataInputLegacy } from 'src/send/SendConfirmationLegacy'
import { Currency } from 'src/utils/currencies'
import { Svg } from 'svgs'

export interface QrCode {
  type: string
  data: string
}

export type SVG = typeof Svg

export enum Actions {
  BARCODE_DETECTED = 'SEND/BARCODE_DETECTED',
  QRCODE_SHARE = 'SEND/QRCODE_SHARE',
  SEND_PAYMENT = 'SEND/SEND_PAYMENT',
  SEND_PAYMENT_LEGACY = 'SEND/SEND_PAYMENT_LEGACY',
  SEND_PAYMENT_SUCCESS = 'SEND/SEND_PAYMENT_SUCCESS',
  SEND_PAYMENT_FAILURE = 'SEND/SEND_PAYMENT_FAILURE',
  UPDATE_LAST_USED_CURRENCY = 'SEND/UPDATE_LAST_USED_CURRENCY',
  SET_SHOW_WARNING = 'SEND/SHOW_WARNING',
}

export interface HandleBarcodeDetectedAction {
  type: Actions.BARCODE_DETECTED
  data: QrCode
  scanIsForSecureSend?: boolean
  transactionData?: TransactionDataInput | TransactionDataInputLegacy
  isOutgoingPaymentRequest?: boolean
  requesterAddress?: string
}

export interface ShareQRCodeAction {
  type: Actions.QRCODE_SHARE
  qrCodeSvg: SVG
}

export interface SendPaymentActionLegacy {
  type: Actions.SEND_PAYMENT_LEGACY
  amount: BigNumber
  currency: Currency
  comment: string
  recipientAddress?: string | null
  feeInfo?: FeeInfo
  firebasePendingRequestUid: string | null | undefined
  fromModal: boolean
}

export interface SendPaymentAction {
  type: Actions.SEND_PAYMENT
  amount: BigNumber
  tokenAddress: string
  usdAmount: BigNumber | null
  comment: string
  recipient: Recipient
  feeInfo: FeeInfo
  fromModal: boolean
}

export interface SendPaymentSuccessAction {
  type: Actions.SEND_PAYMENT_SUCCESS
  amount: BigNumber
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
  | HandleBarcodeDetectedAction
  | ShareQRCodeAction
  | SendPaymentAction
  | SendPaymentActionLegacy
  | SendPaymentSuccessAction
  | SendPaymentFailureAction
  | UpdateLastUsedCurrencyAction
  | SetShowWarningAction

export const handleBarcodeDetected = (
  data: QrCode,
  scanIsForSecureSend?: boolean,
  transactionData?: TransactionDataInput | TransactionDataInputLegacy,
  isOutgoingPaymentRequest?: boolean,
  requesterAddress?: string
): HandleBarcodeDetectedAction => ({
  type: Actions.BARCODE_DETECTED,
  data,
  scanIsForSecureSend,
  transactionData,
  isOutgoingPaymentRequest,
  requesterAddress,
})

export const shareQRCode = (qrCodeSvg: SVG): ShareQRCodeAction => ({
  type: Actions.QRCODE_SHARE,
  qrCodeSvg,
})

export const sendPaymentLegacy = (
  amount: BigNumber,
  currency: Currency,
  comment: string,
  recipientAddress: string | null | undefined,
  feeInfo: FeeInfo | undefined,
  firebasePendingRequestUid: string | null | undefined,
  fromModal: boolean
): SendPaymentActionLegacy => ({
  type: Actions.SEND_PAYMENT_LEGACY,
  amount,
  currency,
  comment,
  recipientAddress,
  feeInfo,
  firebasePendingRequestUid,
  fromModal,
})

export const sendPayment = (
  amount: BigNumber,
  tokenAddress: string,
  usdAmount: BigNumber | null,
  comment: string,
  recipient: Recipient,
  feeInfo: FeeInfo,
  fromModal: boolean
): SendPaymentAction => ({
  type: Actions.SEND_PAYMENT,
  amount,
  tokenAddress,
  usdAmount,
  comment,
  recipient,
  feeInfo,
  fromModal,
})

export const sendPaymentSuccess = (amount: BigNumber): SendPaymentSuccessAction => ({
  type: Actions.SEND_PAYMENT_SUCCESS,
  amount,
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
