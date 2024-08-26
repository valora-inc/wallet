import { UnlockableWallet } from '@celo/wallet-base'
import { RemoteWallet } from '@celo/wallet-remote'
import Logger from 'src/utils/Logger'
import { ImportMnemonicAccount, KeychainAccounts } from 'src/web3/KeychainAccounts'
import { KeychainSigner } from 'src/web3/KeychainSigner'

const TAG = 'web3/KeychainWallet'

/**
 * A wallet which uses the OS keychain to store private keys
 * Note: when we finally remove ContractKit, we can replace it with KeychainAccounts
 */
export class KeychainWallet extends RemoteWallet<KeychainSigner> implements UnlockableWallet {
  /**
   * Construct a new instance of the Keychain wallet
   * @param importMnemonicAccount ImportMnemonicAccount the existing account to import from the mnemonic, if not already present in the keychain
   */
  constructor(
    protected importMnemonicAccount: ImportMnemonicAccount,
    protected accounts: KeychainAccounts
  ) {
    super()
  }

  /**
   * This function does the very critical job of loading in accounts from the Keychain, for instance when the user restarts their app.
   */
  async loadAccountSigners(): Promise<Map<string, KeychainSigner>> {
    const accounts = await this.accounts.loadExistingAccounts(this.importMnemonicAccount)
    const addressToSigner = new Map<string, KeychainSigner>()

    accounts.forEach((account) => {
      addressToSigner.set(account.address, new KeychainSigner(account, this.accounts))
    })
    return addressToSigner
  }

  async addAccount(privateKey: string, passphrase: string): Promise<string> {
    Logger.info(`${TAG}@addAccount`, `Adding a new account`)
    const account = await this.accounts.addAccount(privateKey, passphrase)
    const signer = new KeychainSigner(account, this.accounts)
    this.addSigner(account.address, signer)
    return account.address
  }
  /**
   * Updates the passphrase of an account
   * @param account - the account to update
   * @param oldPassphrase - the passphrase currently associated with the account
   * @param newPassphrase - the new passphrase to use with the account
   * @returns whether the update was successful
   */
  async updateAccount(account: string, oldPassphrase: string, newPassphrase: string) {
    Logger.info(`${TAG}@updateAccount`, `Updating ${account}`)
    return this.accounts.updatePassphrase(account, oldPassphrase, newPassphrase)
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
    return this.accounts.isUnlocked(address)
  }
}
