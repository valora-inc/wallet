import { RLPEncodedTx, Signer } from '@celo/connect'
import { LocalSigner } from '@celo/wallet-local'
import BigNumber from 'bignumber.js'
import Logger from 'src/utils/Logger'
import { EIP712TypedData } from 'src/utils/sign-typed-data-utils'
import { KeychainAccount, KeychainAccounts, getStoredPrivateKey } from 'src/web3/KeychainAccounts'

const TAG = 'web3/KeychainSigner'

/**
 * Implements the signer interface on top of the OS keychain
 */
export class KeychainSigner implements Signer {
  protected unlockedLocalSigner: LocalSigner | null = null
  constructor(
    protected account: KeychainAccount,
    protected accounts: KeychainAccounts
  ) {}

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

    return this.localSigner.signTransaction(addToV, encodedTx)
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(`${TAG}@signPersonalMessage`, `Signing ${data}`)
    return this.localSigner.signPersonalMessage(data)
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(`${TAG}@signTypedData`, `Signing typed DATA:`, { address: this.account, typedData })
    return this.localSigner.signTypedData(typedData)
  }

  getNativeKey() {
    return this.account.address
  }

  async unlock(passphrase: string, duration: number): Promise<boolean> {
    const unlocked = await this.accounts.unlock(this.account.address, passphrase, duration)
    if (!unlocked) {
      return false
    }
    const privateKey = await getStoredPrivateKey(this.account, passphrase)
    if (!privateKey) {
      return false
    }
    this.unlockedLocalSigner = new LocalSigner(privateKey)
    return true
  }

  async decrypt(ciphertext: Buffer): Promise<Buffer> {
    return this.localSigner.decrypt(ciphertext)
  }

  async computeSharedSecret(publicKey: string): Promise<Buffer> {
    return this.localSigner.computeSharedSecret(publicKey)
  }

  protected get localSigner(): LocalSigner {
    if (!this.accounts.isUnlocked(this.account.address)) {
      this.unlockedLocalSigner = null
    }
    if (!this.unlockedLocalSigner) {
      throw new Error('authentication needed: password or unlock')
    }
    return this.unlockedLocalSigner
  }
}
