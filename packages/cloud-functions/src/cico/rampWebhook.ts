import crypto from 'crypto'
import stableStringify from 'fast-json-stable-stringify'
import * as functions from 'firebase-functions'
import { readFileSync } from 'fs'
import { trackEvent } from '../bigQuery'
import { BIGQUERY_PROVIDER_STATUS_TABLE, RAMP_KEY } from '../config'
import { saveTxHashProvider } from '../firebase'
import { CashInStatus, Provider } from './Provider'

const rampKey = readFileSync(`./config/${RAMP_KEY}`).toString()

function verifyRampSignature(signature: string | undefined, body: any) {
  if (!signature || !body) {
    return false
  }

  const verifier = crypto.createVerify('sha256')
  verifier.update(Buffer.from(stableStringify(body)))
  return verifier.verify(rampKey, signature, 'base64')
}

const TRANSACTION_STARTED = 'CREATED'
const TRANSACTION_SUCCESS = 'RELEASED'
const TRANSACTION_EXPIRED = 'EXPIRED'
const TRANSACTION_CANCELLED = 'CANCELLED'

function trackRampEvent(body: any) {
  const {
    type,
    purchase: { id, receiverAddress, status },
  } = body
  if (TRANSACTION_STARTED === type) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Ramp,
      status: CashInStatus.Started,
      timestamp: Date.now() / 1000,
      user_address: receiverAddress,
    })
  } else if (status === TRANSACTION_EXPIRED || status === TRANSACTION_CANCELLED) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Ramp,
      status: CashInStatus.Failure,
      timestamp: Date.now() / 1000,
      user_address: receiverAddress,
      failure_reason: status,
    })
  } else if (TRANSACTION_SUCCESS === status) {
    trackEvent(BIGQUERY_PROVIDER_STATUS_TABLE, {
      id,
      provider: Provider.Ramp,
      status: CashInStatus.Success,
      timestamp: Date.now() / 1000,
      user_address: receiverAddress,
    })
  }
}

const RAMP_SIGNATURE_HEADER = 'X-Body-Signature'
const RAMP_RELEASED = 'RELEASED'
const RAMP_RELEASING = 'RELEASING'

export const rampWebhook = functions.https.onRequest((request, response) => {
  if (verifyRampSignature(request.header(RAMP_SIGNATURE_HEADER), request.body)) {
    trackRampEvent(request.body)
    const {
      type,
      purchase: { receiverAddress, actions, status },
    } = request.body

    console.info('Received Ramp webhook', type, receiverAddress, status)
    if (type === RAMP_RELEASED || type === RAMP_RELEASING) {
      const address = receiverAddress
      const releasedAction = actions.find(
        (action: any) =>
          (action.newStatus === RAMP_RELEASED || action.newStatus === RAMP_RELEASING) &&
          action.details
      )

      const txHash = releasedAction?.details
      if (txHash) {
        saveTxHashProvider(address, txHash, Provider.Ramp)
      } else {
        console.error('Tx hash not found for Ramp release action')
      }
    }
    response.status(204).send()
  } else {
    console.error('ERROR: Invalid or missing signature')
    response.status(401).send()
  }
})
