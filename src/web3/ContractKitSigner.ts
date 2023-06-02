import { RLPEncodedTx } from '@celo/connect'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalSigner } from '@celo/wallet-local'
import BigNumber from 'bignumber.js'
import Logger from 'src/utils/Logger'
import { KeychainAccount } from 'src/web3/types'

const TAG = 'web3/ContractKitSigner'

/**
 * Implements the signer interface on top of the OS keychain
 */
export default class ContractKitSigner extends LocalSigner {
  constructor(privateKey: string, protected account: KeychainAccount) {
    super(privateKey)
  }

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(`${TAG}@signTransaction`, `Signing transaction:`, encodedTx.transaction)
    const { gasPrice } = encodedTx.transaction
    const gasPriceBN = new BigNumber((gasPrice || 0).toString())
    if (gasPriceBN.isNaN() || gasPriceBN.isLessThanOrEqualTo(0)) {
      // Make sure we don't sign and send transactions with 0 gas price
      // This resulted in those TXs being stuck in the txpool for nodes running geth < v1.5.0
      throw new Error(`Preventing sign tx with 'gasPrice' set to '${gasPrice}'`)
    }

    return super.signTransaction(addToV, encodedTx)
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(`${TAG}@signPersonalMessage`, `Signing ${data}`)
    return super.signPersonalMessage(data)
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(`${TAG}@signTypedData`, `Signing typed DATA:`, { address: this.account, typedData })
    return super.signTypedData(typedData)
  }

  getNativeKey() {
    return this.account.address
  }

  async computeSharedSecret(publicKey: string): Promise<Buffer> {
    return super.computeSharedSecret(publicKey)
  }
}
