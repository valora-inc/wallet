import * as functions from 'firebase-functions'
import jwt from 'jsonwebtoken'
import { trackEvent } from '../bigQuery'
import { BIGQUERY_PROVIDER_STATUS_TABLE, TRANSAK_DATA } from '../config'
import { saveTxHashProvider } from '../firebase'
import { CashInStatus, Providers } from './Providers'

interface TransakEventPayload {
  eventID: TransakEvent
  createdAt: string
  webhookData: {
    id: string
    walletAddress: string
    status: TransakStatus
    statusReason?: string
    transactionHash?: string
    createdAt: string
    fiatCurrency: string
    userId: string
    cryptocurrency: string
    isBuyOrSell: 'BUY' | 'SELL'
    fiatAmount: number
    commissionDecimal: number
    fromWalletAddress: string
    walletLink: string
    amountPaid: number
    partnerOrderId: string
    partnerCustomerId: string
    redirectURL: string
    conversionPrice: number
    cryptoAmount: number
    totalFee: number
    paymentOption: string[]
    autoExpiresAt: string
    referenceCode: number
  }
}

enum TransakEvent {
  Created = 'ORDER_CREATED',
  Processing = 'ORDER_COMPLETED',
  PaymentVerifying = 'ORDER_PAYMENT_VERIFYING',
  Completed = 'ORDER_COMPLETED',
  Failed = 'ORDER_FAILED',
}

enum TransakStatus {
  PROCESSING = 'PROCESSING',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  PENDING_DELIVERY_FROM_TRANSAK = 'PENDING_DELIVERY_FROM_TRANSAK',
  PAYMENT_DONE_MARKED_BY_USER = 'PAYMENT_DONE_MARKED_BY_USER',
  AWAITING_PAYMENT_FROM_USER = 'AWAITING_PAYMENT_FROM_USER',
}

function createEventBase(id: string, address: string) {
  return {
    type: 'BUY',
    id,
    provider: Providers.Transak,
    timestamp: Date.now() / 1000,
    user_address: address,
  }
}

async function trackTransakEvent(body: any) {
  const {
    eventID,
    webhookData: { id, walletAddress, statusReason },
  } = body
  if (eventID === TransakEvent.Created) {
    await trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      ...createEventBase(id, walletAddress),
      status: CashInStatus.Started,
    })
  } else if (eventID === TransakEvent.Failed) {
    await trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      ...createEventBase(id, walletAddress),
      status: CashInStatus.Failure,
      failure_reason: statusReason,
    })
  } else if (eventID === TransakEvent.Completed) {
    await trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      ...createEventBase(id, walletAddress),
      status: CashInStatus.Success,
    })
  }
}

export const transakWebhook = functions.https.onRequest(async (request, response) => {
  try {
    const decodedData: TransakEventPayload = jwt.verify(
      request.body.data,
      TRANSAK_DATA.private_key
    ) as TransakEventPayload
    console.info('Transak webhook', JSON.stringify(decodedData))
    await trackTransakEvent(decodedData)
    const {
      eventID,
      webhookData: { id, walletAddress, status, statusReason, transactionHash },
    } = decodedData
    console.info(
      `Received Transak webhook with data: id: ${id} - address: ${walletAddress} \
      - status: ${status} (${statusReason})- eventID: ${eventID} - txHash: ${transactionHash}`
    )
    if (transactionHash) {
      saveTxHashProvider(walletAddress, transactionHash, Providers.Transak)
    }
    response.status(204).send()
  } catch (error) {
    console.error('Error parsing transak webhook data', error)
    response.status(401).send()
  }
})
