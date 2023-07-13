import { normalizeAddressWith0x } from '@celo/utils/lib/address'
import { Chain } from 'src/ethers/types'
import { DEFAULT_FORNO_URL } from 'src/config'
import { ValoraWallet } from 'src/web3/types'
import { TypedDataDomain, TypedDataField } from 'ethers'
import KeychainAccountManager from 'src/web3/KeychainAccountManager'
import { KeychainAccount } from 'src/web3/types'
import { ethers } from 'ethers'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CeloTx, EncodedTransaction } from '@celo/connect'

const providerUrlForChain: Record<Chain, string> = {
  [Chain.Celo]: DEFAULT_FORNO_URL,
}

/**
 * This class is entrusted with non-expiring access to a user's private key.
 * Methods on this class that access/use the user's private key in any way MUST
 * first check if the account is unlocked via the `isAccountUnlocked` method,
 * and throw if the account is not unlocked; this effectively means that such
 * functions require user PIN entry in order to call.
 *
 * Ideally, this responsibility would be enforced programatically. The current approach
 * was opted for out of simplicity and to reduce changes needed on existing critical code.
 */
class ValoraEthersWallet implements ValoraWallet {
  walletMap: Record<string, ethers.Wallet> // keys are lowercase account addresses

  constructor(protected chain: Chain, private keychainAccountManager: KeychainAccountManager) {
    this.walletMap = {}
    this.keychainAccountManager.registerAddAccountCallback(
      async (
        normalizedPrivateKey: string,
        address: string,
        _account: KeychainAccount
      ): Promise<void> => {
        this.addAccountCallback.bind(this)(normalizedPrivateKey, address)
      }
    )
  }

  async signTypedData(
    address: string,
    _domain: TypedDataDomain,
    _types: Record<string, Array<TypedDataField>>,
    _value: Record<string, any>,
    _primaryType: string
  ): Promise<string> {
    if (!this.isAccountUnlocked(address)) {
      throw new Error('Authentication needed')
    }
    throw new Error('Not implemented')
  }

  async signTransaction(tx: CeloTx): Promise<EncodedTransaction> {
    if (!tx.from || !this.isAccountUnlocked(tx.from.toString())) {
      throw new Error('Authentication needed')
    }
    throw new Error('Not implemented')
  }

  async signPersonalMessage(address: string, _data: string): Promise<string> {
    if (!this.isAccountUnlocked(address)) {
      throw new Error('Authentication needed')
    }
    throw new Error('Not implemented')
  }

  async decryptMessage(address: string, _ciphertext: Buffer): Promise<string> {
    if (!this.isAccountUnlocked(address)) {
      throw new Error('Authentication needed')
    }
    throw new Error('Not implemented')
  }

  hasAccount(address?: string): boolean {
    return address !== undefined && normalizeAddressWith0x(address) in this.walletMap
  }

  getAccounts(): string[] {
    return Object.keys(this.walletMap)
  }

  private addAccountCallback(privateKey: string, address: string) {
    if (this.hasAccount(address)) {
      throw new Error(ErrorMessages.KEYCHAIN_ACCOUNT_ALREADY_EXISTS)
    }
    this.walletMap[address] = new ethers.Wallet(
      privateKey,
      new ethers.JsonRpcProvider(providerUrlForChain[this.chain])
    )
  }

  async addAccount(privateKey: string, password: string): Promise<string> {
    return await this.keychainAccountManager.addAccount(privateKey, password)
  }

  async unlockAccount(address: string, password: string, duration: number): Promise<boolean> {
    try {
      return !!(await this.keychainAccountManager.unlockAccount(address, password, duration))
    } catch (error) {
      return false
    }
  }

  async updateAccount(address: string, oldPassword: string, newPassword: string): Promise<boolean> {
    return await this.keychainAccountManager.updateAccount(address, oldPassword, newPassword)
  }

  isAccountUnlocked(address: string): boolean {
    return this.keychainAccountManager.isAccountUnlocked(address)
  }
}

export default ValoraEthersWallet
