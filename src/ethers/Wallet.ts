import ethers from 'ethers'
import { KeychainLock } from 'src/web3/KeychainSigner'
import { UNLOCK_DURATION } from 'src/web3/consts'

let keychainLock: KeychainLock | undefined

export default class Wallet {
  private wallet: ethers.Wallet
  private lock: KeychainLock

  constructor(privateKey: string, providerUrl: string) {
    const wallet = new ethers.Wallet(privateKey)
    const provider = new ethers.JsonRpcProvider(providerUrl)
    const connectedWallet = wallet.connect(provider)
    // A single lock between all ethers wallets
    if (!keychainLock) {
      keychainLock = new KeychainLock({ address: connectedWallet.address, createdAt: new Date() })
    }

    this.wallet = connectedWallet
    this.lock = keychainLock
  }

  get address(): string {
    return this.wallet.address
  }

  // Lock Methods

  async init(password: string) {
    await this.lock.init(this.wallet.privateKey, password)
  }

  async unlock(password: string) {
    await this.lock.unlock(password, UNLOCK_DURATION)
  }

  isUnlocked() {
    return this.lock.isUnlocked()
  }

  // Signer Methods

  /**
   * TODO: implement when we need to support walletconnect connections with the ethers wallet
   */
  async signTransaction(tx: ethers.ethers.TransactionRequest): Promise<string> {
    throw new Error('Not implemented')
  }

  /**
   * TODO: implement when we need to support walletconnect or signing typed messages for auth with the ethers wallet
   */
  async signTypedData(
    domain: ethers.TypedDataDomain,
    types: ethers.TypedDataField,
    value: Record<string, any>
  ): Promise<string> {
    throw new Error('Not implemented')
  }

  /**
   * TODO: implement when we need to support walletconnect or fiatconect with the ethers wallet
   */
  async signMessage(message: string): Promise<string> {
    throw new Error('Not implemented')
  }
}
