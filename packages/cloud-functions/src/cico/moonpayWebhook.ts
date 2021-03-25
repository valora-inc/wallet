import crypto from 'crypto'
import * as functions from 'firebase-functions'
import { trackEvent } from '../bigQuery'
import { BIGQUERY_PROVIDER_STATUS_TABLE, MOONPAY_WEBHOOK_KEY } from '../config'
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

  const hmac = crypto.createHmac('sha256', MOONPAY_WEBHOOK_KEY)
  hmac.write(signedPayload)
  hmac.end()

  const expectedSignature = Buffer.from(hmac.read().toString('hex'))
  const signatureBuffer = Buffer.from(signature)
  return Buffer.compare(signatureBuffer, expectedSignature) === 0
}

const TRANSACTION_STARTED = 'transaction_created'
const TRANSACTION_FAILED = 'transaction_failed'
const TRANSACTION_UPDATED = 'transaction_updated'

function trackMoonpayEvent(body: any) {
  const {
    data: { id, walletAddress, status, failureReason },
    type,
  } = body
  if (TRANSACTION_STARTED === type) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Moonpay,
      status: CashInStatus.Started,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
    })
  } else if (TRANSACTION_FAILED === type) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Moonpay,
      status: CashInStatus.Failure,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
      failure_reason: failureReason,
    })
  } else if (TRANSACTION_UPDATED === type && status === 'completed') {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Moonpay,
      status: CashInStatus.Success,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
    })
  }
}

export const moonpayWebhook = functions.https.onRequest((request, response) => {
  if (
    verifyMoonPaySignature(request.header(MOONPAY_SIGNATURE_HEADER), JSON.stringify(request.body))
  ) {
    trackMoonpayEvent(request.body)
    const {
      data: { walletAddress, cryptoTransactionId },
      type,
    } = request.body
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
