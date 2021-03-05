import crypto from 'crypto'
import express from 'express'
import stableStringify from 'fast-json-stable-stringify'
import { readFileSync } from 'fs'
import jwt from 'jsonwebtoken'
import { MOONPAY_API_KEY, RAMP_KEY, TRANSAK_API_KEY } from '../config'
import { saveTxHashProvider } from '../firebase'

const router = express.Router()

export enum Provider {
  Moonpay = 'Moonpay',
  Simplex = 'Simplex',
  Ramp = 'Ramp',
  Transak = 'Transak',
}

const rampKey = readFileSync(`./config/${RAMP_KEY}`).toString()

const verifyRampSignature = (signature: string | undefined, body: any) => {
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

router.post('/ramp', (req, res) => {
  if (verifyRampSignature(req.header(RAMP_SIGNATURE_HEADER), req.body)) {
    const { type, purchase } = req.body

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
    res.status(204).send()
  } else {
    console.error('ERROR: Invalid or missing signature')
    res.status(401).send()
  }
})

const MOONPAY_SIGNATURE_HEADER = 'Moonpay-Signature-V2'

const verifyMoonPaySignature = (signatureHeader: string | undefined, body: string) => {
  if (!signatureHeader) {
    return false
  }

  const [first, second] = signatureHeader.split(',')
  const timestamp = first.split('=')[1]
  const signature = second.split('=')[1]
  const signedPayload = `${timestamp}.${body}`

  const hmac = crypto.createHmac('sha256', MOONPAY_API_KEY)
  hmac.write(signedPayload)
  hmac.end()

  const expectedSignature = Buffer.from(hmac.read().toString('hex'))
  const signatureBuffer = Buffer.from(signature)
  return Buffer.compare(signatureBuffer, expectedSignature) === 0
}

router.post('/moonpay', (req, res) => {
  if (verifyMoonPaySignature(req.header(MOONPAY_SIGNATURE_HEADER), JSON.stringify(req.body))) {
    const {
      data: { walletAddress, cryptoTransactionId },
      type,
    } = req.body
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
    res.status(204).send()
  } else {
    console.error('ERROR: Missing or invalid signature')
    res.status(401).send()
  }

  res.end()
})

router.post('/transak', (req, res) => {
  const decodedData = jwt.verify(req.body.data, TRANSAK_API_KEY)
  console.info('Received Transak webhook', decodedData)

  res.end()
})

export default router
