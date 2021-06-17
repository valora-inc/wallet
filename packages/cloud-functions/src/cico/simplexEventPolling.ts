import * as functions from 'firebase-functions'
import { trackEvent } from '../bigQuery'
import { DigitalAsset, FiatCurrency, SIMPLEX_DATA } from '../config'
import { fetchWithTimeout, flattenObject, lookupAddressFromTxId } from './utils'

const SIMPLEX_BIG_QUERY_EVENT_TABLE = 'cico_simplex_events'

// https://integrations.simplex.com/wallet-api-integration#events-api_group
interface SimplexEventPayload {
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

// event_id: "string"
// name: "SimplexTxStatus"
// payment_created_at: "string"
// payment_crypto_total_amount_amount: "number"
// payment_crypto_total_amount_currency: "DigitalAsset"
// payment_fiat_total_amount_amount: "number"
// payment_fiat_total_amount_currency: "FiatCurrency"
// payment_id: "string"
// payment_partner_end_user_id: "string"
// payment_status: "string"
// payment_updated_at: "string"
// timestamp: "string"

enum SimplexTxStatus {
  Started = 'payment_request_submitted',
  Completed = 'payment_simplexcc_approved',
  Failed = 'payment_simplexcc_declined',
}

const getSimplexEvents = async () => {
  const response = await fetchWithTimeout(SIMPLEX_DATA.event_url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${SIMPLEX_DATA.api_key}`,
    },
  })

  if (!response.ok) {
    throw new Error(JSON.stringify(response))
  }

  const simplexEvents: SimplexEventPayload = await response.json()
  return simplexEvents
}

const deleteSimplexEvent = async (event: SimplexTransactionEvent) => {
  await fetchWithTimeout(`${SIMPLEX_DATA.event_url}/${event.event_id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `ApiKey ${SIMPLEX_DATA.api_key}`,
    },
  })
}

export const simplexEventPolling = functions.https.onRequest(async (req, res) => {
  try {
    const simplexEvents = await getSimplexEvents()

    await Promise.all(
      simplexEvents.events.map(async (event) => {
        const txId = event.payment.id
        const userAddress = await lookupAddressFromTxId(txId)

        userAddress
          ? console.info(`Found user address ${userAddress} on txId ${txId}`)
          : console.info(`No user address found for txId ${txId}`)

        try {
          const eventTracked = await trackEvent(SIMPLEX_BIG_QUERY_EVENT_TABLE, flattenObject(event))
          if (eventTracked) {
            await deleteSimplexEvent(event)
          }
        } catch (error) {
          console.error("Couldn't track event: ", error)
        }
      })
    )

    res.status(204).end()
  } catch (error) {
    console.error('Error querying for Simplex events: ', error)
    res.status(400).end()
  }
})
