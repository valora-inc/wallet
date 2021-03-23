import crypto from 'crypto'
import stableStringify from 'fast-json-stable-stringify'
import * as functions from 'firebase-functions'
import { readFileSync } from 'fs'
import { RAMP_KEY } from '../config'
import { saveTxHashProvider } from '../firebase'
import { Provider } from './Provider'

const rampKey = readFileSync(`./config/${RAMP_KEY}`).toString()

function verifyRampSignature(signature: string | undefined, body: any) {
  if (!signature || !body) {
    return false
  }

  const verifier = crypto.createVerify('sha256')
  verifier.update(Buffer.from(stableStringify(body)))
  return verifier.verify(rampKey, signature, 'base64')
}

const RAMP_SIGNATURE_HEADER = 'X-Body-Signature'
const RAMP_RELEASED = 'RELEASED'
const RAMP_RELEASING = 'RELEASING'

export const rampWebhook = functions.https.onRequest((request, response) => {
  if (verifyRampSignature(request.header(RAMP_SIGNATURE_HEADER), request.body)) {
    const { type, purchase } = request.body

    console.info('Received Ramp webhook', type, purchase)
    if (type === RAMP_RELEASED || type === RAMP_RELEASING) {
      const address = purchase.receiverAddress
      const releasedAction = purchase.actions.find(
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
