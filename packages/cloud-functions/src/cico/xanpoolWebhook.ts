import * as functions from 'firebase-functions'
import { trackEvent } from '../bigQuery'
import { flattenObject } from './utils'

const XANPOOL_BIG_QUERY_EVENT_TABLE = 'cico_provider_events_xanpool'

interface XanpoolEventPayload {
  timestamp: number
  message: string
  payload: {
    id: string
    type: string
    status: string
    method: string
    crypto: number
    fiat: number
    total: number
    currency: string
    cryptoCurrency: string
    serviceCharge: number
    cryptoPrice: number
    cryptoPriceUsd: number
    nonce: string
    qrCode: string
    wallet: string
    userCountry: string
    userId: string
    peer: {
      account: string
    }
  }
}

// timestamp: integer,
// message: string,
// id: string,
// type: string,
// status: string,
// method: string,
// crypto: float,
// fiat: float,
// total: float,
// currency: string,
// cryptoCurrency: string,
// serviceCharge: float,
// cryptoPrice: float,
// cryptoPriceUsd: float,
// nonce: string,
// qrCode: string,
// wallet: string,
// userCountry: string,
// userId: string,
// peer_account: string

// This needs to be all lowercase due to a bug in Xanpool's dashboard
export const xanpoolwebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { timestamp, message, payload }: XanpoolEventPayload = req.body
    const data = flattenObject({ timestamp, message, ...payload })
    await trackEvent(XANPOOL_BIG_QUERY_EVENT_TABLE, data)

    res.status(204).send()
  } catch (error) {
    console.error('Error parsing webhook event: ', JSON.stringify(error))
    console.info('Request body: ', JSON.stringify(req.body))
    res.status(400).end()
  }
})
