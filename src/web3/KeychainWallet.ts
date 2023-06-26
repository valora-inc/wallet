import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { UnlockableWallet } from '@celo/wallet-base'
import { RemoteWallet } from '@celo/wallet-remote'
import { KeychainAccount } from 'src/web3/types'
import Logger from 'src/utils/Logger'
import { ImportMnemonicAccount, KeychainSigner } from 'src/web3/KeychainSigner'
import KeychainAccountManager from 'src/web3/KeychainAccountManager'
import { ErrorMessages } from 'src/app/ErrorMessages'

const TAG = 'web3/KeychainWallet'

/**
 * A wallet which uses the OS keychain to store private keys
 */
export class KeychainWallet extends RemoteWallet<KeychainSigner> implements UnlockableWallet {
  /**
   * Construct a new instance of the Keychain wallet
   * @param importMnemonicAccount ImportMnemonicAccount the existing account to import from the mnemonic, if not already present in the keychain
   */
  constructor(
    protected importMnemonicAccount: ImportMnemonicAccount,
    private keychainAccountManager: KeychainAccountManager
  ) {
    super()
    this.keychainAccountManager.registerAddAccountCallback(
      async (
        _normalizedPrivateKey: string,
        address: string,
        account: KeychainAccount
      ): Promise<void> => {
        this._addAccount(address, account)
      }
    )
  }

  async loadAccountSigners(): Promise<Map<string, KeychainSigner>> {
    const accounts = await this.keychainAccountManager.loadAccounts(this.importMnemonicAccount)
    const addressToSigner = new Map<string, KeychainSigner>()

    accounts.forEach((account) => {
      addressToSigner.set(account.address, new KeychainSigner(account, this.keychainAccountManager))
    })
    return addressToSigner
  }

  private _addAccount(address: string, account: KeychainAccount) {
    if (this.hasAccount(address)) {
      throw new Error(ErrorMessages.KEYCHAIN_ACCOUNT_ALREADY_EXISTS)
    }
    const signer = new KeychainSigner(account, this.keychainAccountManager)
    this.addSigner(address, signer)
  }

  async addAccount(privateKey: string, passphrase: string): Promise<string> {
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    const normalizedPrivateKey = normalizeAddressWith0x(privateKey)
    const address = normalizeAddressWith0x(privateKeyToAddress(normalizedPrivateKey))
    const account = { address, createdAt: new Date() }
    return await this.keychainAccountManager.addAccount(privateKey, account, passphrase)
  }
  /**
   * Updates the passphrase of an account
   * @param account - the account to update
   * @param oldPassphrase - the passphrase currently associated with the account
   * @param newPassphrase - the new passphrase to use with the account
   * @returns whether the update was successful
   */
  async updateAccount(
    account: string,
    oldPassphrase: string,
    newPassphrase: string
  ): Promise<boolean> {
    Logger.info(`${TAG}@updateAccount`, `Updating ${account}`)
    const signer = this.getSigner(account)
    return signer.updatePassphrase(oldPassphrase, newPassphrase)
  }

  /**
   * Unlocks an account for a given duration
   * @param account String the account to unlock
   * @param passphrase String the passphrase of the account
   * @param duration Number the duration of the unlock period in seconds
   */
  async unlockAccount(account: string, passphrase: string, duration: number) {
    Logger.info(`${TAG}@unlockAccount`, `Unlocking ${account}`)
    const signer = this.getSigner(account)
    return signer.unlock(passphrase, duration)
  }

  isAccountUnlocked(address: string) {
    const signer = this.getSigner(address)
    return signer.isUnlocked()
  }
}
