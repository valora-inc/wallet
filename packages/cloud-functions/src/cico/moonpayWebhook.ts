import crypto from 'crypto'
import * as functions from 'firebase-functions'
import { MOONPAY_WEBHOOK_KEY } from '../config'
import { saveTxHashProvider } from '../firebase'
import { Provider } from './Provider'

const MOONPAY_SIGNATURE_HEADER = 'Moonpay-Signature-V2'

function verifyMoonPaySignature(signatureHeader: string | undefined, body: string) {
  if (!signatureHeader) {
    return false
  }

  const [first, second] = signatureHeader.split(',')
  const timestamp = first.split('=')[1]
  const signature = second.split('=')[1]
  const signedPayload = `${timestamp}.${body}`

  const hmac = crypto.createHmac('sha256', MOONPAY_WEBHOOK_KEY)
  hmac.write(signedPayload)
  hmac.end()

  const expectedSignature = Buffer.from(hmac.read().toString('hex'))
  const signatureBuffer = Buffer.from(signature)
  return Buffer.compare(signatureBuffer, expectedSignature) === 0
}

// https://www.moonpay.com/dashboard/api_reference/client_side_api/#transactions
interface MoonpayTransaction {
  id: string
  createdAt: string // ISO date-time string
  updatedAt: string // ISO date-time string
  baseCurrencyAmount: number
  quoteCurrencyAmount: number
  feeAmount: number
  extraFeeAmount: number
  networkFeeAmount: number
  areFeesIncluded: boolean
  status: MoonpayTxStatus
  failureReason: string
  walletAddress: string
  walletAddressTag: string
  cryptoTransactionId: string
  redirectUrl: string
  returnUrl: string
  widgetRedirectUrl?: string
  eurRate: number
  usdRate: number
  gbpRate: number
  bankDepositInformation?: any
  bankTransferReference?: string
  currencyId: string
  baseCurrencyId: string
  customerId: string
  cardId: string
  bankAccountId?: string
  externalCustomerId?: string
  externalTransactionId?: string
  country: string
  state: string // Only for USA customers
  stages: any[] // This is a complex array of objects. See the docs above!
}

enum MoonpayTxStatus {
  WaitingPayment = 'waitingPayment',
  Pending = 'pending',
  WaitingAuthorization = 'waitingAuthorization',
  Failed = 'failed',
  Completed = 'completed',
}

enum MoonpayWebhookType {
  Started = 'transaction_started',
  Failed = 'transaction_failed',
  Updated = 'transaction_updated',
  IdCheckUpdated = 'identity_check_updated',
  SellTxCreated = 'sell_transaction_created',
  SellTxUpdated = 'sell_transaction_updated',
  SellTxFailed = 'sell_transaction_failed',
  ExternalToken = 'external_token',
}
interface MoonpayRequestBody {
  type: MoonpayWebhookType
  data: MoonpayTransaction
}

export const moonpayWebhook = functions.https.onRequest((request, response) => {
  if (
    verifyMoonPaySignature(request.header(MOONPAY_SIGNATURE_HEADER), JSON.stringify(request.body))
  ) {
    const {
      data: { walletAddress, cryptoTransactionId },
      type,
    }: MoonpayRequestBody = request.body
    console.info(
      'Received MoonPay webhook',
      type,
      'Address:',
      walletAddress,
      'TxHash:',
      cryptoTransactionId
    )

    if (cryptoTransactionId) {
      saveTxHashProvider(walletAddress, cryptoTransactionId, Provider.Moonpay)
    } else {
      console.error('Tx hash not found on MoonPay webhook')
    }
    response.status(204).send()
  } else {
    console.error('ERROR: Missing or invalid signature')
    response.status(401).send()
  }

  response.end()
})
