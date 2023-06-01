import ethers from 'ethers'
import { DEFAULT_FORNO_URL } from 'src/config'
import { Chain } from 'src/ethers/types'
import { KeychainLock } from 'src/web3/KeychainSigner'

const providerUrlForChain = {
  [Chain.Celo]: DEFAULT_FORNO_URL,
}

export class LockableEthersWallet extends KeychainLock<ethers.Wallet> {
  newLocalSigner(privateKey: string): ethers.ethers.Wallet {
    return new ethers.Wallet(privateKey)
  }
}

export default class Wallet extends LockableEthersWallet {
  private get wallet() {
    return this.localSigner
  }

  getConnectedWallet(chain: Chain): ethers.Wallet {
    return this.wallet.connect(new ethers.JsonRpcProvider(providerUrlForChain[chain]))
  }

  get address() {
    return this.account.address
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
