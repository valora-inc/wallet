import * as functions from 'firebase-functions'
import { fetchWithTimeout } from 'src/cico/utils'
import { trackEvent } from '../bigQuery'
import { BIGQUERY_PROVIDER_STATUS_TABLE, DigitalAsset, FiatCurrency, SIMPLEX_DATA } from '../config'
import { CashInStatus, Providers } from './Providers'

function trackSimplexEvent(body: any) {
  const {
    data: { id, walletAddress, status, failureReason },
    type,
  } = body
  if (SimplexTxStatus.Started === type) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Providers.Simplex,
      status: CashInStatus.Started,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
    })
  } else if (status === SimplexTxStatus.Failed) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Providers.Simplex,
      status: CashInStatus.Failure,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
      failure_reason: failureReason,
    })
  } else if (status === SimplexTxStatus.Completed) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Providers.Simplex,
      status: CashInStatus.Success,
      timestamp: Date.now() / 1000,
      user_address: walletAddress,
    })
  }
}

// https://integrations.simplex.com/wallet-api-integration#events-api_group
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

interface SimplexEventResponse {
  events: SimplexTransactionEvent[]
}

enum SimplexTxStatus {
  Started = 'payment_simplexcc_submitted',
  Completed = 'payment_simplexcc_approved',
  Failed = 'payment_simplexcc_declined',
}

export const simplexEventPolling = functions.https.onRequest(async (req, res) => {
  try {
    const response = await fetchWithTimeout(SIMPLEX_DATA.event_url, {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${SIMPLEX_DATA.api_key}`,
    })

    res.status(204).end()
  } catch (error) {
    console.error('ERROR: Missing or invalid signature')
    res.status(401).send()
  }
})
