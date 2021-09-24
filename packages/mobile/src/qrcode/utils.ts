import * as RNFS from 'react-native-fs'
import Share from 'react-native-share'
import { call, put, select } from 'redux-saga/effects'
import { showError, showMessage } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import { SendOrigin, WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { walletConnectEnabledSelector } from 'src/app/selectors'
import { validateRecipientAddressSuccess } from 'src/identity/actions'
import { E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UriData, uriDataFromUrl } from 'src/qrcode/schema'
import {
  getRecipientFromAddress,
  recipientHasNumber,
  RecipientInfo,
} from 'src/recipients/recipient'
import { QrCode, SVG } from 'src/send/actions'
import { TransactionDataInput } from 'src/send/SendAmount'
import { handleSendPaymentData } from 'src/send/utils'
import Logger from 'src/utils/Logger'
import { initialiseWalletConnect } from 'src/walletConnect/saga'

export enum BarcodeTypes {
  QR_CODE = 'QR_CODE',
}

const TAG = 'QR/utils'

const QRFileName = '/celo-qr.png'

export async function shareSVGImage(svg: SVG) {
  if (!svg) {
    return
  }
  const data = await new Promise<string>((resolve, reject) => {
    svg.toDataURL((dataURL: string | undefined) => {
      if (dataURL) {
        resolve(dataURL)
      } else {
        // Not supposed to happen, but throw in case it does :)
        reject(new Error('Got invalid SVG data'))
      }
    })
  })

  const path = RNFS.DocumentDirectoryPath + QRFileName
  await RNFS.writeFile(path, data, 'base64')
  return Share.open({
    url: 'file://' + path,
    type: 'image/png',
    failOnCancel: false, // don't throw if user cancels share
  })
}

function* handleSecureSend(
  address: string,
  e164NumberToAddress: E164NumberToAddressType,
  secureSendTxData: TransactionDataInput,
  requesterAddress?: string
) {
  if (!recipientHasNumber(secureSendTxData.recipient)) {
    throw Error('Invalid recipient type for Secure Send, has no mobile number')
  }

  const userScannedAddress = address.toLowerCase()
  const { e164PhoneNumber } = secureSendTxData.recipient
  const possibleReceivingAddresses = e164NumberToAddress[e164PhoneNumber]
  // This should never happen. Secure Send is triggered when there are
  // multiple addresses for a given phone number
  if (!possibleReceivingAddresses) {
    throw Error("No addresses associated with recipient's phone number")
  }

  // Need to add the requester address to the option set in the event
  // a request is coming from an unverified account
  if (requesterAddress && !possibleReceivingAddresses.includes(requesterAddress)) {
    possibleReceivingAddresses.push(requesterAddress)
  }
  const possibleReceivingAddressesFormatted = possibleReceivingAddresses.map((addr) =>
    addr.toLowerCase()
  )
  if (!possibleReceivingAddressesFormatted.includes(userScannedAddress)) {
    const error = ErrorMessages.QR_FAILED_INVALID_RECIPIENT
    ValoraAnalytics.track(SendEvents.send_secure_incorrect, {
      confirmByScan: true,
      error,
    })
    yield put(showMessage(error))
    return false
  }

  ValoraAnalytics.track(SendEvents.send_secure_complete, { confirmByScan: true })
  yield put(validateRecipientAddressSuccess(e164PhoneNumber, userScannedAddress))
  return true
}

export function* handleBarcode(
  barcode: QrCode,
  e164NumberToAddress: E164NumberToAddressType,
  recipientInfo: RecipientInfo,
  secureSendTxData?: TransactionDataInput,
  isOutgoingPaymentRequest?: boolean,
  requesterAddress?: string
) {
  const walletConnectEnabled: boolean = yield select(walletConnectEnabledSelector)
  if (barcode.data.startsWith('wc:') && walletConnectEnabled) {
    navigate(Screens.WalletConnectLoading, { origin: WalletConnectPairingOrigin.Scan })
    yield call(initialiseWalletConnect, barcode.data, WalletConnectPairingOrigin.Scan)
    return
  }

  let qrData: UriData
  try {
    qrData = uriDataFromUrl(barcode.data)
  } catch (e) {
    yield put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
    Logger.error(TAG, 'qr scan failed', e)
    return
  }

  if (secureSendTxData) {
    const success: boolean = yield call(
      handleSecureSend,
      qrData.address,
      e164NumberToAddress,
      secureSendTxData,
      requesterAddress
    )
    if (!success) {
      return
    }

    if (isOutgoingPaymentRequest) {
      navigate(Screens.PaymentRequestConfirmation, {
        transactionData: secureSendTxData,
        addressJustValidated: true,
      })
    } else {
      navigate(Screens.SendConfirmation, {
        transactionData: secureSendTxData,
        addressJustValidated: true,
        origin: SendOrigin.AppSendFlow,
      })
    }

    return
  }

  const cachedRecipient = getRecipientFromAddress(qrData.address, recipientInfo)

  yield call(handleSendPaymentData, qrData, cachedRecipient, isOutgoingPaymentRequest, true)
}
