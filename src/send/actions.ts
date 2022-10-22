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
  SEND_PAYMENT_OR_INVITE = 'SEND/SEND_PAYMENT_OR_INVITE',
  SEND_PAYMENT_OR_INVITE_LEGACY = 'SEND/SEND_PAYMENT_OR_INVITE_LEGACY',
  SEND_PAYMENT_OR_INVITE_SUCCESS = 'SEND/SEND_PAYMENT_OR_INVITE_SUCCESS',
  SEND_PAYMENT_OR_INVITE_FAILURE = 'SEND/SEND_PAYMENT_OR_INVITE_FAILURE',
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

export interface SendPaymentOrInviteActionLegacy {
  type: Actions.SEND_PAYMENT_OR_INVITE_LEGACY
  amount: BigNumber
  currency: Currency
  comment: string
  recipient: Recipient
  recipientAddress?: string | null
  feeInfo?: FeeInfo
  firebasePendingRequestUid: string | null | undefined
  fromModal: boolean
}

export interface SendPaymentOrInviteAction {
  type: Actions.SEND_PAYMENT_OR_INVITE
  amount: BigNumber
  tokenAddress: string
  usdAmount: BigNumber | null
  comment: string
  recipient: Recipient
  feeInfo: FeeInfo
  fromModal: boolean
  localAmount: BigNumber | null
}

export interface SendPaymentOrInviteSuccessAction {
  type: Actions.SEND_PAYMENT_OR_INVITE_SUCCESS
  amount: BigNumber
}

export interface SendPaymentOrInviteFailureAction {
  type: Actions.SEND_PAYMENT_OR_INVITE_FAILURE
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
  | SendPaymentOrInviteAction
  | SendPaymentOrInviteActionLegacy
  | SendPaymentOrInviteSuccessAction
  | SendPaymentOrInviteFailureAction
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

export const sendPaymentOrInviteLegacy = (
  amount: BigNumber,
  currency: Currency,
  comment: string,
  recipient: Recipient,
  recipientAddress: string | null | undefined,
  feeInfo: FeeInfo | undefined,
  firebasePendingRequestUid: string | null | undefined,
  fromModal: boolean
): SendPaymentOrInviteActionLegacy => ({
  type: Actions.SEND_PAYMENT_OR_INVITE_LEGACY,
  amount,
  currency,
  comment,
  recipient,
  recipientAddress,
  feeInfo,
  firebasePendingRequestUid,
  fromModal,
})

export const sendPaymentOrInvite = (
  amount: BigNumber,
  tokenAddress: string,
  usdAmount: BigNumber | null,
  comment: string,
  recipient: Recipient,
  feeInfo: FeeInfo,
  fromModal: boolean
): SendPaymentOrInviteAction => ({
  type: Actions.SEND_PAYMENT_OR_INVITE,
  amount,
  tokenAddress,
  usdAmount,
  comment,
  recipient,
  feeInfo,
  fromModal,
})

export const sendPaymentOrInviteSuccess = (
  amount: BigNumber
): SendPaymentOrInviteSuccessAction => ({
  type: Actions.SEND_PAYMENT_OR_INVITE_SUCCESS,
  amount,
})

export const sendPaymentOrInviteFailure = (): SendPaymentOrInviteFailureAction => ({
  type: Actions.SEND_PAYMENT_OR_INVITE_FAILURE,
})

export const updateLastUsedCurrency = (currency: Currency): UpdateLastUsedCurrencyAction => ({
  type: Actions.UPDATE_LAST_USED_CURRENCY,
  currency,
})

export const setShowWarning = (showWarning: boolean): SetShowWarningAction => ({
  type: Actions.SET_SHOW_WARNING,
  showWarning,
})
