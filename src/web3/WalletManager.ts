import { Chain } from 'src/ethers/types'
import { ImportMnemonicAccount } from 'src/web3/KeychainSigner'
import KeychainAccountManager from 'src/web3/KeychainAccountManager'
import ValoraCeloWallet from 'src/web3/ValoraCeloWallet'
import ValoraEthersWallet from 'src/ethers/ValoraEthersWallet'

class WalletManager {
  keychainAccountManager: KeychainAccountManager
  contractKitWallet?: ValoraCeloWallet
  ethersWallets?: Record<Chain, ValoraEthersWallet>

  constructor(private importMnemonicAccount: ImportMnemonicAccount) {
    this.keychainAccountManager = new KeychainAccountManager()
  }

  async init() {
    await this.keychainAccountManager.init(this.importMnemonicAccount)
    this.contractKitWallet = new ValoraCeloWallet(
      this.importMnemonicAccount,
      this.keychainAccountManager
    )
    this.ethersWallets = {
      [Chain.Celo]: new ValoraEthersWallet(Chain.Celo, this.keychainAccountManager),
    }
  }

  getContractKitWallet(): ValoraCeloWallet {
    if (!this.contractKitWallet) {
      throw new Error(`No contractkit wallet found. Must call init first.`)
    }
    return this.contractKitWallet
  }

  getEthersWallet(chain: Chain): ValoraEthersWallet {
    if (!this.ethersWallets) {
      throw new Error(`No Ethers wallet found for chain ${chain}. Must call init first.`)
    }
    return this.ethersWallets[chain]
  }
}

export default WalletManager
