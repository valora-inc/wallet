import crypto from 'crypto'
import * as functions from 'firebase-functions'
import { trackEvent } from '../bigQuery'
import { BIGQUERY_PROVIDER_STATUS_TABLE, MOONPAY_DATA } from '../config'
import { saveTxHashProvider } from '../firebase'
import { CashInStatus, Provider } from './Provider'

const MOONPAY_SIGNATURE_HEADER = 'Moonpay-Signature-V2'

function verifyMoonPaySignature(signatureHeader: string | undefined, body: string) {
  if (!signatureHeader) {
    return false
  }

  const [first, second] = signatureHeader.split(',')
  const timestamp = first.split('=')[1]
  const signature = second.split('=')[1]
  const signedPayload = `${timestamp}.${body}`

  const hmac = crypto.createHmac('sha256', MOONPAY_DATA.webhook_key)
  hmac.write(signedPayload)
  hmac.end()

  const expectedSignature = Buffer.from(hmac.read().toString('hex'))
  const signatureBuffer = Buffer.from(signature)
  return Buffer.compare(signatureBuffer, expectedSignature) === 0
}

function trackMoonpayEvent(body: any) {
  const {
    data: { id, walletAddress, status, failureReason },
    type,
  } = body
  if (MoonpayWebhookType.Started === type) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Moonpay,
      status: CashInStatus.Started,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
    })
  } else if (status === MoonpayTxStatus.Failed) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Moonpay,
      status: CashInStatus.Failure,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
      failure_reason: failureReason,
    })
  } else if (status === MoonpayTxStatus.Completed) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Moonpay,
      status: CashInStatus.Success,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
    })
  }
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
    trackMoonpayEvent(request.body)
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
