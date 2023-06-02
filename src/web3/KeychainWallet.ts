import { Address } from '@celo/connect'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { UnlockableWallet } from '@celo/wallet-base'
import { RemoteWallet } from '@celo/wallet-remote'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Logger from 'src/utils/Logger'
import ContractKitSigner from 'src/web3/ContractKitSigner'
import { KeychainAccountManager, listStoredAccounts } from 'src/web3/KeychainAccountManager'
import { ImportMnemonicAccount } from 'src/web3/types'

const TAG = 'web3/KeychainWallet'

/**
 * A wallet which uses the OS keychain to store private keys
 */
export class KeychainWallet extends RemoteWallet<ContractKitSigner> implements UnlockableWallet {
  private keychainAccounts = new Map<string, KeychainAccountManager>()
  /**
   * Construct a new instance of the Keychain wallet
   * @param importMnemonicAccount ImportMnemonicAccount the existing account to import from the mnemonic, if not already present in the keychain
   */
  constructor(protected importMnemonicAccount: ImportMnemonicAccount) {
    super()
  }

  /**
   * Gets a list of addresses that have been registered
   */
  getAccounts(): Address[] {
    return Array.from(this.keychainAccounts.keys())
  }

  /**
   * Gets a single account been registered
   */
  getAccount(address: string): KeychainAccountManager {
    const normalizedAddress = normalizeAddressWith0x(address)
    if (!this.keychainAccounts.has(normalizedAddress)) {
      throw new Error(`Could not find address ${normalizedAddress}`)
    }
    return this.keychainAccounts.get(normalizedAddress)!
  }

  /**
   * Returns true if account has been registered
   * @param address Account to check
   */
  hasAccount(address?: Address): boolean {
    if (address) {
      const normalizedAddress = normalizeAddressWith0x(address)
      return this.keychainAccounts.has(normalizedAddress)
    } else {
      return false
    }
  }

  protected getSigner(address: string): ContractKitSigner {
    const normalizedAddress = normalizeAddressWith0x(address)
    if (!this.keychainAccounts.has(normalizedAddress)) {
      throw new Error(`Could not find address ${normalizedAddress}`)
    }
    return this.keychainAccounts.get(normalizedAddress)!.unlockedContractKitSigner
  }

  async loadAccountSigners(): Promise<Map<string, ContractKitSigner>> {
    const accounts = await listStoredAccounts(this.importMnemonicAccount)
    accounts.forEach((account) => {
      const accountManager = new KeychainAccountManager(account)
      this.keychainAccounts.set(account.address, accountManager)
    })
    return new Map<string, ContractKitSigner>()
  }

  async addAccount(privateKey: string, passphrase: string): Promise<string> {
    Logger.info(`${TAG}@addAccount`, `Adding a new account`)
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    const normalizedPrivateKey = normalizeAddressWith0x(privateKey)
    const address = normalizeAddressWith0x(privateKeyToAddress(normalizedPrivateKey))
    if (this.hasAccount(address)) {
      throw new Error(ErrorMessages.KEYCHAIN_ACCOUNT_ALREADY_EXISTS)
    }
    const accountManager = new KeychainAccountManager({ address, createdAt: new Date() })
    await accountManager.init(normalizedPrivateKey, passphrase)
    this.keychainAccounts.set(address, accountManager)
    return address
  }
  /**
   * Updates the passphrase of an account
   * @param address - the account to update
   * @param oldPassphrase - the passphrase currently associated with the account
   * @param newPassphrase - the new passphrase to use with the account
   * @returns whether the update was successful
   */
  async updateAccount(address: string, oldPassphrase: string, newPassphrase: string) {
    Logger.info(`${TAG}@updateAccount`, `Updating ${address}`)
    const accountManager = this.getAccount(address)
    return accountManager.updatePassphrase(oldPassphrase, newPassphrase)
  }

  /**
   * Unlocks an account for a given duration
   * @param account String the account to unlock
   * @param passphrase String the passphrase of the account
   * @param duration Number the duration of the unlock period in seconds
   */
  async unlockAccount(address: string, passphrase: string, duration: number) {
    Logger.info(`${TAG}@unlockAccount`, `Unlocking ${address}`)
    const accountManager = this.getAccount(address)
    return accountManager.unlock(passphrase, duration)
  }

  isAccountUnlocked(address: string) {
    const accountManager = this.getAccount(address)
    return accountManager.isUnlocked()
  }
}
