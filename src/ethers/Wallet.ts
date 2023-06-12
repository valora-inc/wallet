import { ethers } from 'ethers'
import { DEFAULT_FORNO_URL } from 'src/config'
import { Chain } from 'src/ethers/types'

export const providerUrlForChain = {
  [Chain.Celo]: DEFAULT_FORNO_URL,
}

/**
 * A wallet class for signing, making transactions, etc on the ethers.js platform
 * One wallet per address per chain
 */
export default class Wallet {
  wallet: ethers.Wallet

  constructor(privateKey: string, provider: ethers.Provider) {
    this.wallet = new ethers.Wallet(privateKey, provider)
  }
  // Signer Methods

  /**
   * TODO: implement when we need to support walletconnect connections with the ethers wallet
   * may be as simple as super.signTransaction(...args), but should verify that it produces the same signature as the contractkit signer
   */
  async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
    throw new Error('Not implemented')
  }

  /**
   * TODO: implement when we need to support walletconnect or signing typed messages for auth with the ethers wallet
   * may be as simple as super.signTypedData(...args), but should verify that it produces the same signature as the contractkit signer
   */
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
  async signMessage(message: string): Promise<string> {
    throw new Error('Not implemented')
  }
}
