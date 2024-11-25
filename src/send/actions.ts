import BigNumber from 'bignumber.js'
import { Recipient } from 'src/recipients/recipient'
import { QrCode } from 'src/send/types'
import { Currency } from 'src/utils/currencies'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { Svg } from 'svgs'

export type SVG = typeof Svg

export enum Actions {
  BARCODE_DETECTED = 'SEND/BARCODE_DETECTED',
  BARCODE_DETECTED_SECURE_SEND = 'SEND/BARCODE_DETECTED_SECURE_SEND',
  QRCODE_SHARE = 'SEND/QRCODE_SHARE',
  SEND_PAYMENT = 'SEND/SEND_PAYMENT',
  SEND_PAYMENT_SUCCESS = 'SEND/SEND_PAYMENT_SUCCESS',
  SEND_PAYMENT_FAILURE = 'SEND/SEND_PAYMENT_FAILURE',
  UPDATE_LAST_USED_CURRENCY = 'SEND/UPDATE_LAST_USED_CURRENCY',
}

export interface HandleQRCodeDetectedAction {
  type: Actions.BARCODE_DETECTED
  qrCode: QrCode
  defaultTokenIdOverride?: string
}

export interface HandleQRCodeDetectedSecureSendAction {
  type: Actions.BARCODE_DETECTED_SECURE_SEND
  qrCode: QrCode
  requesterAddress?: string
  recipient: Recipient
  forceTokenId?: boolean
  defaultTokenIdOverride?: string
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
  recipient: Recipient
  fromModal: boolean
  preparedTransaction: SerializableTransactionRequest
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

export type ActionTypes =
  | HandleQRCodeDetectedAction
  | HandleQRCodeDetectedSecureSendAction
  | ShareQRCodeAction
  | SendPaymentAction
  | SendPaymentSuccessAction
  | SendPaymentFailureAction
  | UpdateLastUsedCurrencyAction

export const handleQRCodeDetected = ({
  qrCode,
  defaultTokenIdOverride,
}: {
  qrCode: QrCode
  defaultTokenIdOverride?: string
}): HandleQRCodeDetectedAction => ({
  type: Actions.BARCODE_DETECTED,
  qrCode,
  defaultTokenIdOverride,
})

export const handleQRCodeDetectedSecureSend = (
  qrCode: QrCode,
  recipient: Recipient,
  requesterAddress?: string,
  forceTokenId?: boolean,
  defaultTokenIdOverride?: string
): HandleQRCodeDetectedSecureSendAction => ({
  type: Actions.BARCODE_DETECTED_SECURE_SEND,
  qrCode,
  requesterAddress,
  recipient,
  forceTokenId,
  defaultTokenIdOverride,
})

export const shareQRCode = (qrCodeSvg: SVG): ShareQRCodeAction => ({
  type: Actions.QRCODE_SHARE,
  qrCodeSvg,
})

export const sendPayment = (
  amount: BigNumber,
  tokenId: string,
  usdAmount: BigNumber | null,
  recipient: Recipient,
  fromModal: boolean,
  preparedTransaction: SerializableTransactionRequest
): SendPaymentAction => ({
  type: Actions.SEND_PAYMENT,
  amount,
  tokenId,
  usdAmount,
  recipient,
  fromModal,
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
