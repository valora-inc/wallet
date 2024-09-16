import { useMemo } from 'react'
import * as RNFS from 'react-native-fs'
import Share from 'react-native-share'
import { showError, showMessage } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { QrScreenEvents, SendEvents } from 'src/analytics/Events'
import {
  HooksEnablePreviewOrigin,
  SendOrigin,
  WalletConnectPairingOrigin,
} from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DEEP_LINK_URL_SCHEME } from 'src/config'
import { validateRecipientAddressSuccess } from 'src/identity/actions'
import { E164NumberToAddressType } from 'src/identity/reducer'
import { getSecureSendAddress } from 'src/identity/secureSend'
import {
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { handleEnableHooksPreviewDeepLink } from 'src/positions/saga'
import { allowHooksPreviewSelector } from 'src/positions/selectors'
import { UriData, uriDataFromUrl } from 'src/qrcode/schema'
import {
  Recipient,
  RecipientInfo,
  getRecipientFromAddress,
  recipientHasNumber,
} from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import {
  HandleQRCodeDetectedAction,
  HandleQRCodeDetectedSecureSendAction,
  SVG,
} from 'src/send/actions'
import { QrCode } from 'src/send/types'
import { handleSendPaymentData } from 'src/send/utils'
import Logger from 'src/utils/Logger'
import { initialiseWalletConnect, isWalletConnectEnabled } from 'src/walletConnect/saga'
import { handleLoadingWithTimeout } from 'src/walletConnect/walletConnect'
import { call, fork, put, select } from 'typed-redux-saga'
import { isAddress } from 'viem'

export enum QRCodeTypes {
  QR_CODE = 'QR_CODE',
}

const TAG = 'QR/utils'

const QRFileName = '/wallet_address-qr.png'

// DeepLink generates a QR code that deeplinks into the walletconnect send flow of the app
// Address generates a QR code that has the walletAddress as plaintext that is readable by wallets such as Coinbase and Metamask
export function useQRContent(data: {
  address: string
  displayName: string | undefined
  e164PhoneNumber: string | undefined
}) {
  return useMemo(() => data.address, [data.address, data.displayName, data.e164PhoneNumber, data])
}

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

export function* handleSecureSend(
  address: string,
  e164NumberToAddress: E164NumberToAddressType,
  recipient: Recipient,
  requesterAddress?: string
) {
  if (!recipientHasNumber(recipient)) {
    throw Error('Invalid recipient type for Secure Send, has no mobile number')
  }

  const userScannedAddress = address.toLowerCase()
  const { e164PhoneNumber } = recipient
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
    AppAnalytics.track(SendEvents.send_secure_incorrect, {
      confirmByScan: true,
      error,
    })
    yield* put(showMessage(error))
    return false
  }

  AppAnalytics.track(SendEvents.send_secure_complete, { confirmByScan: true })
  yield* put(validateRecipientAddressSuccess(e164PhoneNumber, userScannedAddress))
  return true
}

function* extractQRAddressData(qrCode: QrCode) {
  // strip network prefix if present
  const qrAddress = qrCode.data.split(':').at(-1) || qrCode.data
  if (isAddress(qrAddress, { strict: false })) {
    qrCode.data = `${DEEP_LINK_URL_SCHEME}://wallet/pay?address=${qrAddress}`
  }
  let qrData: UriData | null
  try {
    qrData = uriDataFromUrl(qrCode.data)
  } catch (e) {
    yield* put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
    Logger.error(TAG, 'qr scan failed', e)
    qrData = null
  }
  return qrData
}

// Catch all handler for QR Codes
// includes support for WalletConnect, hooks, and send flow (non-secure send)
export function* handleQRCodeDefault({ qrCode }: HandleQRCodeDetectedAction) {
  AppAnalytics.track(QrScreenEvents.qr_scanned, qrCode)

  const walletConnectEnabled: boolean = yield* call(isWalletConnectEnabled, qrCode.data)

  // TODO there's some duplication with deep links handing
  // would be nice to refactor this
  if (qrCode.data.startsWith('wc:') && walletConnectEnabled) {
    yield* fork(handleLoadingWithTimeout, WalletConnectPairingOrigin.Scan)
    yield* call(initialiseWalletConnect, qrCode.data, WalletConnectPairingOrigin.Scan)
    return
  }
  if (
    (yield* select(allowHooksPreviewSelector)) &&
    qrCode.data.startsWith(`${DEEP_LINK_URL_SCHEME}://wallet/hooks/enablePreview`)
  ) {
    yield* call(handleEnableHooksPreviewDeepLink, qrCode.data, HooksEnablePreviewOrigin.Scan)
    return
  }

  const qrData = yield* call(extractQRAddressData, qrCode)
  if (!qrData) {
    return
  }
  const recipientInfo: RecipientInfo = yield* select(recipientInfoSelector)
  const cachedRecipient = getRecipientFromAddress(qrData.address, recipientInfo)

  yield* call(handleSendPaymentData, qrData, true, cachedRecipient)
}

export function* handleQRCodeSecureSend({
  qrCode,
  requesterAddress,
  recipient,
  forceTokenId,
  defaultTokenIdOverride,
}: HandleQRCodeDetectedSecureSendAction) {
  const e164NumberToAddress = yield* select(e164NumberToAddressSelector)
  AppAnalytics.track(QrScreenEvents.qr_scanned, qrCode)

  const qrData = yield* call(extractQRAddressData, qrCode)
  if (!qrData) {
    return
  }

  const success: boolean = yield* call(
    handleSecureSend,
    qrData.address,
    e164NumberToAddress,
    recipient,
    requesterAddress
  )
  if (!success) {
    return
  }

  const secureSendPhoneNumberMapping = yield* select(secureSendPhoneNumberMappingSelector)
  const address = getSecureSendAddress(recipient, secureSendPhoneNumberMapping)
  if (!address) {
    // should never happen b/c if handleSecureSend succeeds then address should be there
    Logger.error(TAG, `No secure send address found for recipient ${recipient}`)
    return
  }
  navigate(Screens.SendEnterAmount, {
    origin: SendOrigin.AppSendFlow,
    recipient: {
      ...recipient,
      address,
    },
    isFromScan: true,
    forceTokenId,
    defaultTokenIdOverride,
  })
}
