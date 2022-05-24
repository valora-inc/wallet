import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { UnlockableWallet } from '@celo/wallet-base'
import { RemoteWallet } from '@celo/wallet-remote'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { listStoredItems } from 'src/storage/keychain'
import Logger from 'src/utils/Logger'
import { ACCOUNT_STORAGE_KEY_PREFIX, KeychainSigner } from 'src/web3/KeychainSigner'

const TAG = 'web3/KeychainWallet'

/**
 * A wallet which uses the OS keychain to store private keys
 */
export class KeychainWallet extends RemoteWallet<KeychainSigner> implements UnlockableWallet {
  constructor() {
    super()
  }

  async loadAccountSigners(): Promise<Map<string, KeychainSigner>> {
    let accounts: string[]
    const addressToSigner = new Map<string, KeychainSigner>()

    try {
      const storedItems = await listStoredItems()
      Logger.info(`${TAG}@loadAccountSigners`, storedItems)
      accounts = storedItems
        .filter((item) => item.startsWith(ACCOUNT_STORAGE_KEY_PREFIX))
        .map((item) => item.slice(ACCOUNT_STORAGE_KEY_PREFIX.length))
    } catch (e) {
      Logger.error(`${TAG}@loadAccountSigners`, 'Error listing accounts', e)
      throw new Error(ErrorMessages.GETH_FETCH_ACCOUNTS)
    }

    accounts.forEach((address) => {
      const cleanAddress = normalizeAddressWith0x(address)
      addressToSigner.set(cleanAddress, new KeychainSigner(cleanAddress))
    })
    return addressToSigner
  }

  async addAccount(privateKey: string, passphrase: string): Promise<string> {
    Logger.info(`${TAG}@addAccount`, `Adding a new account`)
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    const normalizedPrivateKey = normalizeAddressWith0x(privateKey)
    const address = normalizeAddressWith0x(privateKeyToAddress(normalizedPrivateKey))
    if (this.hasAccount(address)) {
      throw new Error(ErrorMessages.GETH_ACCOUNT_ALREADY_EXISTS)
    }
    const signer = new KeychainSigner(address)
    await signer.init(normalizedPrivateKey, passphrase)
    this.addSigner(address, signer)
    return address
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
    const signer = this.getSigner(account)
    return signer.updatePassphrase(oldPassphrase, newPassphrase)
  }

  /**
   * Unlocks an account for a given duration
   * @param account String the account to unlock
   * @param passphrase String the passphrase of the account
   * @param duration Number the duration of the unlock period
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
