import crypto from 'crypto'
import stableStringify from 'fast-json-stable-stringify'
import * as functions from 'firebase-functions'
import { readFileSync } from 'fs'
import { RAMP_DATA } from '../config'
import { saveTxHashProvider } from '../firebase'
import { Provider } from './Provider'

const rampKey = readFileSync(`./config/${RAMP_DATA.pem_file}`).toString()

function verifyRampSignature(signature: string | undefined, body: RampRequestBody) {
  if (!signature || !body) {
    return false
  }

  const verifier = crypto.createVerify('sha256')
  verifier.update(Buffer.from(stableStringify(body)))
  return verifier.verify(rampKey, signature, 'base64')
}

interface RampPurchase {
  id: number
  endTime: string | null // datestring
  asset: AssetInfo // description of the purchased asset (address, symbol, name, decimals)
  escrowAddress?: string
  receiverAddress: string // blockchain address of the buyer
  cryptoAmount: string // number-string, in wei or token units
  fiatCurrency: string // three-letter currency code
  fiatValue: string // number-string
  assetExchangeRate: number
  poolFee?: string // number-string, seller fee for escrow-based purchases
  rampFee: string // number-string, Ramp fee
  escrowDetailsHash?: string // hash of purchase details used on-chain for escrow-based purchases
  finalTxHash?: string // hash of the crypto transfer blockchain transaction, filled once available
  createdAt: string // ISO date-time string
  updatedAt: string // ISO date-time string
  status: PurchaseStatus // See available values below
}

enum PurchaseStatus {
  Initialized = 'INITIALIZED', // The purchase was initialized.
  PaymentStarted = 'PAYMENT_STARTED', // An automated payment was initiated, eg. via card or open banking.
  PaymentInProgress = 'PAYMENT_IN_PROGRESS', // User completed the payment process.
  PaymentFailed = 'PAYMENT_FAILED', // The last payment was cancelled, rejected, or otherwise failed.
  PaymentExecuted = 'PAYMENT_EXECUTED', // The last payment was successful.
  FiatSent = 'FIAT_SENT', // Outgoing bank transfer was confirmed on the buyer's account.
  FiatReceived = 'FIAT_RECEIVED', // Payment was confirmed, final checks before crypto transfer.
  Releasing = 'RELEASING', // Crypto release started – transfer transaction or escrow release() tx was sent.
  Released = 'RELEASED', // Crypto asset was confirmed to be transferred to the buyer. A terminal state.
  Expired = 'EXPIRED', // The time to pay for the purchase was exceeded. A terminal state.
  Cancelled = 'CANCELLED', // The purchase was cancelled and won't be continued. A terminal state.
}

interface AssetInfo {
  address: string | null // 0x-prefixed address for ERC-20 tokens, `null` for ETH
  symbol: string // asset symbol, for example `ETH`, `DAI`, `USDC`
  name: string
  decimals: number // token decimals, e.g. 18 for ETH/DAI, 6 for USDC
}

enum RampWebhookType {
  Created = 'CREATED',
  Released = 'RELEASED',
  Returned = 'RETURNED',
  Error = 'ERROR',
}

interface RampRequestBody {
  type: RampWebhookType
  purchase: RampPurchase
}

const RAMP_SIGNATURE_HEADER = 'X-Body-Signature'

export const rampWebhook = functions.https.onRequest((request, response) => {
  if (verifyRampSignature(request.header(RAMP_SIGNATURE_HEADER), request.body)) {
    const {
      type,
      purchase: { receiverAddress, finalTxHash },
    }: RampRequestBody = request.body

    console.info('Received Ramp webhook', type, receiverAddress)
    if (type === RampWebhookType.Released) {
      const address = receiverAddress

      if (finalTxHash) {
        saveTxHashProvider(address, finalTxHash, Provider.Ramp)
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
