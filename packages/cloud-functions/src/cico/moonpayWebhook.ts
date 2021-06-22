import crypto from 'crypto'
import * as functions from 'firebase-functions'
import { trackEvent } from '../bigQuery'
import { MOONPAY_DATA } from '../config'
import { saveTxHashProvider } from '../firebase'
import { Providers } from './Providers'

const MOONPAY_SIGNATURE_HEADER = 'Moonpay-Signature-V2'
const MOONPAY_BIG_QUERY_EVENT_TABLE = 'cico_provider_events_moonpay'

// https://www.moonpay.com/dashboard/api_reference/client_side_api/#transactions
interface MoonpayRequestBody {
  type: MoonpayWebhookType
  data: MoonpayTransaction
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
  failureReason: MoonpayFailureReason | null
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

enum MoonpayFailureReason {
  card_not_supported = 'card_not_supported ',
  daily_purchase_limit_exceeded = 'daily_purchase_limit_exceeded ',
  payment_authorization_declined = 'payment_authorization_declined ',
  timeout_3d_secure = 'timeout_3d_secure ',
  timeout_bank_transfer = 'timeout_bank_transfer ',
  timeout_kyc_verification = 'timeout_kyc_verification ',
  timeout_card_verification = 'timeout_card_verification ',
  rejected_kyc = 'rejected_kyc ',
  rejected_card = 'rejected_card ',
  rejected_other = 'rejected_other ',
  cancelled = 'cancelled ',
  refund = 'refund ',
  failed_testnet_withdrawal = 'failed_testnet_withdrawal ',
  error = 'error ',
}

const verifyMoonPaySignature = (signatureHeader: string | undefined, body: string) => {
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

export const moonpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const validSignature = verifyMoonPaySignature(
      req.header(MOONPAY_SIGNATURE_HEADER),
      JSON.stringify(req.body)
    )

    if (!validSignature) {
      throw new Error('Invalid or missing signature')
    }

    const { type, data }: MoonpayRequestBody = req.body
    const { walletAddress, cryptoTransactionId, status } = data
    console.info(`Received ${type} event with status ${status} for ${walletAddress}`)

    if (cryptoTransactionId) {
      console.info(`Tx hash: ${cryptoTransactionId}`)
      saveTxHashProvider(walletAddress, cryptoTransactionId, Providers.Moonpay)
    } else {
      console.info('Tx hash not found on MoonPay event')
    }

    await trackEvent(MOONPAY_BIG_QUERY_EVENT_TABLE, {
      type,
      ...data,
      bankDepositInformation: JSON.stringify(data.bankDepositInformation),
      stages: JSON.stringify(data.stages),
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error parsing Moonpay webhook event: ', error)
    res.status(400).end()
  }
})
