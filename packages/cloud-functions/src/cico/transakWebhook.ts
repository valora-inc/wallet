import * as functions from 'firebase-functions'
import jwt from 'jsonwebtoken'
import { trackEvent } from '../bigQuery'
import { BIGQUERY_PROVIDER_STATUS_TABLE, TRANSAK_DATA } from '../config'
import { saveTxHashProvider } from '../firebase'
import { CashInStatus, Provider } from './Provider'

enum TransakEvent {
  Created = 'ORDER_CREATED',
  Failed = 'ORDER_FAILED',
  Completed = 'ORDER_COMPLETED',
}

function trackTransakEvent(body: any) {
  const {
    eventID,
    webhookData: { id, walletAddress, statusReason },
  } = body
  if (eventID === TransakEvent.Created) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Transak,
      status: CashInStatus.Started,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
    })
  } else if (eventID === TransakEvent.Failed) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Transak,
      status: CashInStatus.Failure,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
      failure_reason: statusReason,
    })
  } else if (eventID === TransakEvent.Completed) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Transak,
      status: CashInStatus.Success,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
    })
  }
}

interface TransakPayload {
  eventID: string
  webhookData: {
    id: string
    walletAddress: string
    status: string
    statusReason?: string
    transactionHash?: string
  }
}

export const transakWebhook = functions.https.onRequest((request, response) => {
  try {
    const decodedData: TransakPayload = jwt.verify(
      request.body.data,
      TRANSAK_DATA.private_key
    ) as TransakPayload
    console.log('Transak webhook', JSON.stringify(decodedData))
    trackTransakEvent(decodedData)
    const {
      eventID,
      webhookData: { id, walletAddress, status, statusReason, transactionHash },
    } = decodedData
    console.info(
      `Received Transak webhook with data: id: ${id} - address: ${walletAddress} \
      - status: ${status} (${statusReason})- eventID: ${eventID} - txHash: ${transactionHash}`
    )
    if (transactionHash) {
      saveTxHashProvider(walletAddress, transactionHash, Provider.Transak)
    } else {
      console.error('Tx hash not found on Transak webhook')
    }
    response.status(204).send()
  } catch (error) {
    console.error('Error parsing transak webhook data', error)
    response.status(401).send()
  }
})
