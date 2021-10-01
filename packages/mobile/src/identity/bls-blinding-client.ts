import { hexToBuffer } from '@celo/base/lib/address'
import { BlsBlindingClient } from '@celo/identity/lib/odis/bls-blinding-client'
import crypto from 'crypto'
import { ec as EC } from 'elliptic'
import BlindThresholdBls from 'react-native-blind-threshold-bls'

const ec = new EC('secp256k1')

/**
 * Wraps the React Native BLS client
 */
export class ReactBlsBlindingClient implements BlsBlindingClient {
  private odisPubKey: string
  private base64Random: string

  constructor(odisPubKey: string, base64Random: string) {
    this.odisPubKey = odisPubKey
    this.base64Random = base64Random
  }

  async blindMessage(base64PhoneNumber: string): Promise<string> {
    return (
      await BlindThresholdBls.blindMessageWithRandom(base64PhoneNumber, this.base64Random)
    ).trim()
  }

  unblindAndVerifyMessage(base64BlindSig: string): Promise<string> {
    return BlindThresholdBls.unblindMessage(base64BlindSig, this.odisPubKey)
  }

  static generateDeterministicBlindingFactor(privateKeyHex: string, e164Number: string): string {
    // Use signature with DEK as deterministic random blinding factor
    const key = ec.keyFromPrivate(hexToBuffer(privateKeyHex))
    const sig = JSON.stringify(key.sign(e164Number).toDER())
    const sigHash = crypto.createHash('sha256').update(sig).digest('base64')
    const byteBuffer = []
    const buffer = Buffer.from(sigHash, 'utf16le')
    for (let i = 0; i < 32; i++) {
      byteBuffer.push(buffer[i])
    }
    return Buffer.from(byteBuffer).toString('base64')
  }
}
