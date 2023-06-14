import { ethers } from 'ethers'
import { DEFAULT_FORNO_URL } from 'src/config'
import { Chain } from 'src/ethers/types'
import { Unlockable } from 'src/web3/KeychainAccountManager'
import { KeychainAccount } from 'src/web3/types'
export const providerUrlForChain = {
  [Chain.Celo]: DEFAULT_FORNO_URL,
}

/**
 * A wallet class for signing, making transactions, etc on the ethers.js platform
 * One wallet per address per chain
 */
export default class Wallet extends Unlockable {
  wallet: ethers.Wallet | null
  provider: ethers.Provider

  constructor(
    privateKey: string,
    provider: ethers.Provider,
    protected keychainAccount: KeychainAccount
  ) {
    super(keychainAccount)
    this.provider = provider
    this.wallet = new ethers.Wallet(privateKey, provider)
  }

  protected async onUnlock(privateKey: string) {
    this.wallet = new ethers.Wallet(privateKey, this.provider)
  }

  protected async onLock() {
    this.wallet = null
  }

  // Signer Methods

  /**
   * TODO: implement when we need to support walletconnect connections with the ethers wallet
   * may be as simple as super.signTransaction(...args), but should verify that it produces the same signature as the contractkit signer
   */
  @Unlockable.requiresLock()
  async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
    throw new Error('Not implemented')
  }

  /**
   * TODO: implement when we need to support walletconnect or signing typed messages for auth with the ethers wallet
   * may be as simple as super.signTypedData(...args), but should verify that it produces the same signature as the contractkit signer
   */
  @Unlockable.requiresLock()
  async signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>
  ): Promise<string> {
    throw new Error('Not implemented')
  }

  /**
   * TODO: implement when we need to support walletconnect or fiatconect with the ethers wallet
   * may be as simple as super.signMessage(...args), but should verify that it produces the same signature as the contractkit signer
   */
  @Unlockable.requiresLock()
  async signMessage(message: string): Promise<string> {
    throw new Error('Not implemented')
  }
}
