import CryptoJS from 'crypto-js'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { generateKeysFromMnemonic, getStoredMnemonic } from 'src/backup/utils'
import {
  listStoredItems,
  removeStoredItem,
  retrieveStoredItem,
  storeItem,
} from 'src/storage/keychain'
import Logger from 'src/utils/Logger'
import {
  isValidAddress,
  normalizeAddress,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from 'src/utils/address'
import { ViemKeychainAccount, keychainAccountToAccount } from 'src/viem/keychainAccountToAccount'
import { type Hex } from 'viem'
import { type Address } from 'viem/accounts'

const TAG = 'web3/KeychainAccounts'

export const ACCOUNT_STORAGE_KEY_PREFIX = 'account--'

interface KeychainAccount {
  address: string
  createdAt: Date
  importFromMnemonic?: boolean
}

interface ImportMnemonicAccount {
  address: string | null
  createdAt: Date
}

// Produces a storage key that looks like this: "account--2022-05-24T13:55:47.117Z--2d936b3ada6142b4248de1847c14fa2f4c5b63c3"
function accountStorageKey(account: KeychainAccount) {
  if (!isValidAddress(account.address)) {
    throw new Error('Expecting valid address for computing storage key')
  }
  return `${ACCOUNT_STORAGE_KEY_PREFIX}${account.createdAt.toISOString()}--${normalizeAddress(
    account.address
  )}`
}

export async function encryptPrivateKey(privateKey: string, password: string) {
  return CryptoJS.AES.encrypt(privateKey, password).toString()
}

export async function decryptPrivateKey(encryptedPrivateKey: string, password: string) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (e) {
    // decrypt can sometimes throw if the inputs are incorrect (encryptedPrivateKey or password)
    Logger.warn(TAG, 'Failed to decrypt private key', e)
    return null
  }
}

async function storePrivateKey(privateKey: string, account: KeychainAccount, password: string) {
  const encryptedPrivateKey = await encryptPrivateKey(privateKey, password)
  return storeItem({ key: accountStorageKey(account), value: encryptedPrivateKey })
}

// Note: ideally this wouldn't be exported, so we don't accidentally expose the private key
// but it's needed for now to support the existing KeychainAccounts and the viem wallet
export async function getStoredPrivateKey(
  account: KeychainAccount,
  password: string
): Promise<string | null> {
  Logger.debug(
    `${TAG}@getStoredPrivateKey`,
    `Checking keychain for private key for account`,
    account
  )
  const encryptedPrivateKey = await retrieveStoredItem(accountStorageKey(account))
  if (!encryptedPrivateKey) {
    if (account.importFromMnemonic) {
      Logger.info(
        `${TAG}@getStoredPrivateKey`,
        `Private key for existing account ${account.address} not found in keychain, importing from mnemonic now`
      )
      return await importAndStorePrivateKeyFromMnemonic(account, password)
    }

    throw new Error('No private key found in storage')
  }

  const privateKey = await decryptPrivateKey(encryptedPrivateKey, password)
  if (!privateKey) {
    return privateKey
  }

  // There was a bug introduced in https://github.com/valora-inc/wallet/blob/f7b3a2cc7c2689a17b7eb50edfdb1b8743f441d1/src/web3/KeychainAccountManager.ts#L63-L71
  // which caused the private key to be stored without the 0x prefix
  // so all accounts created or imported after that change will have the private key stored without the 0x prefix
  // Later on we reverted the code with the bug and it caused signing issues for these accounts.
  // Here we make sure that we always return the private key with the 0x prefix
  return normalizeAddressWith0x(privateKey)
}

/**
 * Returns accounts that have been stored in the keychain, sorted by creation date
 * The ordering is important: Geth KeyStore did this and some parts of the code base rely on it.
 * @param importMnemonicAccount ImportMnemonicAccount the existing account to import from the mnemonic, if not already present in the keychain
 */
export async function listStoredAccounts(importMnemonicAccount?: ImportMnemonicAccount) {
  let accounts: KeychainAccount[]
  try {
    const storedItems = await listStoredItems()
    Logger.info(`${TAG}@listStoredAccounts`, 'Keychain items:', storedItems)
    accounts = storedItems
      .filter((item) => item.startsWith(ACCOUNT_STORAGE_KEY_PREFIX))
      .map((item) => {
        const [isoDate, rawAddress] = item.slice(ACCOUNT_STORAGE_KEY_PREFIX.length).split('--')
        const address = normalizeAddressWith0x(rawAddress)
        const createdAt = new Date(isoDate)
        return {
          address,
          createdAt,
        }
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    // Check if we need to migrate the existing Geth KeyStore based account into the keychain, by importing it from the mnemonic
    if (importMnemonicAccount?.address) {
      const normalizedMnemonicAccountAddress = normalizeAddressWith0x(importMnemonicAccount.address)
      const account = accounts.find((a) => a.address === normalizedMnemonicAccountAddress)
      if (!account) {
        Logger.info(
          `${TAG}@listStoredAccounts`,
          `Existing account ${importMnemonicAccount.address} not found in the keychain, will import from the stored mnemonic on next unlock`
        )
        const now = Date.now()
        // Ensure the imported account is always first in the list
        const maxCreationTime = Math.min(
          importMnemonicAccount.createdAt.getTime(),
          (accounts[0]?.createdAt.getTime() ?? now) - 1,
          now
        )
        const createdAt = new Date(maxCreationTime)
        accounts = [
          { address: normalizedMnemonicAccountAddress, createdAt, importFromMnemonic: true },
          ...accounts,
        ]
      }
    }
  } catch (e) {
    Logger.error(`${TAG}@listStoredAccounts`, 'Error listing accounts', e)
    throw new Error(ErrorMessages.KEYCHAIN_FETCH_ACCOUNTS)
  }
  return accounts
}

async function importAndStorePrivateKeyFromMnemonic(account: KeychainAccount, password: string) {
  const mnemonic = await getStoredMnemonic(account.address, password)
  if (!mnemonic) {
    throw new Error('No mnemonic found in storage')
  }

  const { privateKey } = await generateKeysFromMnemonic(mnemonic)
  if (!privateKey) {
    throw new Error('Failed to generate private key from mnemonic')
  }

  // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
  const normalizedPrivateKey = normalizeAddressWith0x(privateKey) as Address
  const accountFromPrivateKey = normalizeAddressWith0x(privateKeyToAddress(normalizedPrivateKey))
  if (accountFromPrivateKey !== account.address) {
    throw new Error(
      `Generated private key address (${accountFromPrivateKey}) does not match the existing account address (${account.address})`
    )
  }

  await storePrivateKey(normalizedPrivateKey, account, password)

  return normalizedPrivateKey
}

export async function clearStoredAccounts() {
  Logger.info(`${TAG}@clearStoredAccounts`, 'Clearing all accounts from keychain')
  const accounts = await listStoredAccounts()
  await Promise.all(accounts.map((account) => removeStoredItem(accountStorageKey(account))))
}

export class KeychainAccounts {
  protected loadedAccounts: Map<
    string,
    {
      // Timestamp in milliseconds when the keychain was last unlocked
      unlockTime?: number
      // Number of seconds that the keychain was last unlocked for
      unlockDuration?: number
      account: KeychainAccount
      viemAccount: ViemKeychainAccount
    }
  > = new Map()

  async loadExistingAccounts(
    importMnemonicAccount?: ImportMnemonicAccount
  ): Promise<KeychainAccount[]> {
    const accounts = await listStoredAccounts(importMnemonicAccount)

    for (const account of accounts) {
      this.addExistingAccount(account)
    }
    return accounts
  }

  async addAccount(privateKey: string, passphrase: string): Promise<KeychainAccount> {
    Logger.info(`${TAG}@addAccount`, `Adding a new account`)
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    const normalizedPrivateKey = normalizeAddressWith0x(privateKey) as Address
    const address = normalizeAddressWith0x(privateKeyToAddress(normalizedPrivateKey))
    if (this.loadedAccounts.has(address)) {
      throw new Error(ErrorMessages.KEYCHAIN_ACCOUNT_ALREADY_EXISTS)
    }
    const account = { address, createdAt: new Date() }
    this.addExistingAccount(account)
    await storePrivateKey(privateKey, account, passphrase)
    return account
  }

  private addExistingAccount(account: KeychainAccount) {
    const viemAccount = keychainAccountToAccount({
      address: account.address as Address,
      isUnlocked: () => this.isUnlocked(account.address),
    })
    this.loadedAccounts.set(normalizeAddressWith0x(account.address), { account, viemAccount })
  }

  // This mimics the behavior of the removed KeychainWallet
  // Makes it easier for existing code to transition to this new class
  // TODO: we should remove this and stop relying on the order of accounts
  getAccounts(): string[] {
    return Array.from(this.loadedAccounts.keys())
  }

  /**
   * Unlocks an account for a given duration
   * A duration of 0 means the account is unlocked indefinitely
   * */
  async unlock(address: string, passphrase: string, duration: number) {
    const normalizedAddress = normalizeAddressWith0x(address)
    Logger.debug(`${TAG}@unlock`, `Unlocking keychain for ${address} for ${duration} seconds`)
    if (!this.loadedAccounts.has(normalizedAddress)) {
      return false
    }
    const { account, viemAccount } = this.loadedAccounts.get(normalizedAddress)!
    const privateKey = await getStoredPrivateKey(account, passphrase)
    if (!privateKey) {
      return false
    }
    this.loadedAccounts.set(normalizedAddress, {
      account,
      viemAccount,
      unlockTime: Date.now(),
      unlockDuration: duration,
    })
    viemAccount.unlock(privateKey as Hex)
    return true
  }

  isUnlocked(address: string): boolean {
    const normalizedAddress = normalizeAddressWith0x(address)
    if (!this.loadedAccounts.has(normalizedAddress)) {
      return false
    }
    const { unlockTime, unlockDuration } = this.loadedAccounts.get(normalizedAddress)!
    if (unlockDuration === undefined || unlockTime === undefined) {
      return false
    }

    // Unlock duration of 0 means the account is unlocked indefinitely
    if (unlockDuration === 0) {
      return true
    }

    return unlockTime + unlockDuration * 1000 > Date.now()
  }

  /**
   * Updates the passphrase of an account
   * @param oldPassphrase - the passphrase currently associated with the account
   * @param newPassphrase - the new passphrase to use with the account
   * @returns whether the update was successful
   */
  async updatePassphrase(address: string, oldPassphrase: string, newPassphrase: string) {
    const normalizedAddress = normalizeAddressWith0x(address)
    if (!this.loadedAccounts.has(normalizedAddress)) {
      return false
    }
    const account = this.loadedAccounts.get(normalizedAddress)!.account
    const privateKey = await getStoredPrivateKey(account, oldPassphrase)
    if (!privateKey) {
      return false
    }
    await storePrivateKey(privateKey, account, newPassphrase)
    return true
  }

  getViemAccount(address: string): ViemKeychainAccount | undefined {
    const normalizedAddress = normalizeAddressWith0x(address)
    return this.loadedAccounts.get(normalizedAddress)?.viemAccount
  }
}
