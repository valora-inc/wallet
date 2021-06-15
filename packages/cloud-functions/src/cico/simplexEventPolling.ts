import * as functions from 'firebase-functions'
import { trackEvent } from '../bigQuery'
import { BIGQUERY_PROVIDER_STATUS_TABLE, DigitalAsset, FiatCurrency, SIMPLEX_DATA } from '../config'
import { CashInStatus, Providers } from './Providers'
import { fetchWithTimeout, lookupAddressFromTxId } from './utils'

const trackSimplexEvent = async (
  txId: string,
  status: SimplexTxStatus,
  walletAddress: string,
  timestamp: string
) => {
  if (status === SimplexTxStatus.Started) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id: txId,
      provider: Providers.Simplex,
      status: CashInStatus.Started,
      timestamp,
      user_address: walletAddress,
    })
  } else if (status === SimplexTxStatus.Failed) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id: txId,
      provider: Providers.Simplex,
      status: CashInStatus.Failure,
      timestamp,
      user_address: walletAddress,
    })
  } else if (status === SimplexTxStatus.Completed) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id: txId,
      provider: Providers.Simplex,
      status: CashInStatus.Success,
      timestamp,
      user_address: walletAddress,
    })
  }
}

// https://integrations.simplex.com/wallet-api-integration#events-api_group
interface SimplexEventResponse {
  events: SimplexTransactionEvent[]
}

interface SimplexTransactionEvent {
  event_id: string
  name: SimplexTxStatus
  payment: {
    id: string
    status: string
    created_at: string
    updated_at: string
    fiat_total_amount: {
      amount: number
      currency: FiatCurrency
    }
    crypto_total_amount: {
      amount: number
      currency: DigitalAsset
    }
    partner_end_user_id: string
  }
  timestamp: string
}

enum SimplexTxStatus {
  Started = 'payment_simplexcc_submitted',
  Completed = 'payment_simplexcc_approved',
  Failed = 'payment_simplexcc_declined',
}

export const simplexEventPolling = functions.https.onRequest(async (req, res) => {
  try {
    const response = await fetchWithTimeout(SIMPLEX_DATA.event_url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey ${SIMPLEX_DATA.api_key}`,
      },
    })

    if (!response.ok) {
      throw new Error(JSON.stringify(response))
    }

    console.info('Response: ', response)

    const simplexEvents: SimplexEventResponse = await response.json()

    if (!response.ok) {
      console.error('Simplex error!', JSON.stringify(simplexEvents))
      throw new Error(JSON.stringify(simplexEvents))
    }

    await Promise.all(
      simplexEvents.events.map(async (event) => {
        const status = event.name
        const txId = event.payment.id
        const timestamp = event.payment.created_at
        const userAddress = await lookupAddressFromTxId(txId)
        console.info(`Found user address ${userAddress} on txId ${txId}`)
        await trackSimplexEvent(txId, status, userAddress, timestamp)
      })
    )

    res.status(204).end()
  } catch (error) {
    console.error('There was an error!', error)
    res.status(400).end()
  }
})
