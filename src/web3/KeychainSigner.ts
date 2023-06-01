import { RLPEncodedTx, Signer } from '@celo/connect'
import {
  isValidAddress,
  normalizeAddress,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalSigner } from '@celo/wallet-local'
import BigNumber from 'bignumber.js'
import CryptoJS from 'crypto-js'
import ethers from 'ethers'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { generateKeysFromMnemonic, getStoredMnemonic } from 'src/backup/utils'
import {
  listStoredItems,
  removeStoredItem,
  retrieveStoredItem,
  storeItem,
} from 'src/storage/keychain'
import Logger from 'src/utils/Logger'

const TAG = 'web3/KeychainSigner'

export const ACCOUNT_STORAGE_KEY_PREFIX = 'account--'

export interface KeychainAccount {
  address: string
  createdAt: Date
  importFromMnemonic?: boolean
}

export interface ImportMnemonicAccount {
  address: string | null
  createdAt: Date
}

// Map of account address to unlock time and duration
// This helps keep the locks of the same account in sync across ethers & contractkit wallets
const KeychainLocks = new Map<
  string,
  {
    unlockTime: number // Timestamp in milliseconds when the lock was last unlocked
    unlockDuration: number // Number of seconds that the lock was last unlocked for
  }
>()

// Produces a storage key that looks like this: "account--2022-05-24T13:55:47.117Z--2d936b3ada6142b4248de1847c14fa2f4c5b63c3"
function accountStorageKey(account: KeychainAccount) {
  if (!isValidAddress(account.address)) {
    throw new Error('Expecting valid address for computing storage key')
  }
  return `${ACCOUNT_STORAGE_KEY_PREFIX}${account.createdAt.toISOString()}--${normalizeAddress(
    account.address
  )}`
}

async function encryptPrivateKey(privateKey: string, password: string) {
  return CryptoJS.AES.encrypt(privateKey, password).toString()
}

async function decryptPrivateKey(encryptedPrivateKey: string, password: string) {
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

async function getStoredPrivateKey(
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

  return await decryptPrivateKey(encryptedPrivateKey, password)
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
  const normalizedPrivateKey = normalizeAddressWith0x(privateKey)
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

export abstract class KeychainLock<T extends ethers.Wallet | LocalSigner> {
  protected unlockedLocalSigner: T | null = null

  abstract newLocalSigner(privateKey: string): T

  /**
   * Construct a new instance of the Keychain Lock
   *
   * @param account Account address derived from the private key to be called in init
   */
  constructor(protected account: KeychainAccount) {}

  async init(privateKey: string, passphrase: string) {
    await storePrivateKey(privateKey, this.account, passphrase)
  }

  async unlock(passphrase: string, duration: number): Promise<boolean> {
    const privateKey = await getStoredPrivateKey(this.account, passphrase)
    if (!privateKey) {
      return false
    }
    this.unlockedLocalSigner = this.newLocalSigner(privateKey)
    KeychainLocks.set(accountStorageKey(this.account), {
      unlockTime: Date.now(),
      unlockDuration: duration,
    })
    return true
  }

  isUnlocked(): boolean {
    const lockInfo = KeychainLocks.get(accountStorageKey(this.account))
    if (!lockInfo) {
      return false
    }

    if (lockInfo.unlockDuration === 0) {
      return true
    }

    return lockInfo.unlockTime + lockInfo.unlockDuration * 1000 > Date.now()
  }

  /**
   * Get the local signer. Throws if not unlocked.
   */
  protected get localSigner() {
    if (!this.isUnlocked()) {
      this.unlockedLocalSigner = null
    }
    if (!this.unlockedLocalSigner) {
      throw new Error('authentication needed: password or unlock')
    }
    return this.unlockedLocalSigner
  }
}

/**
 * Implements the signer interface on top of the OS keychain
 */
export class KeychainSigner extends KeychainLock<LocalSigner> implements Signer {
  newLocalSigner(privateKey: string): LocalSigner {
    return new LocalSigner(privateKey)
  }

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(`${TAG}@signTransaction`, `Signing transaction:`, encodedTx.transaction)
    const { gasPrice } = encodedTx.transaction
    const gasPriceBN = new BigNumber((gasPrice || 0).toString())
    if (gasPriceBN.isNaN() || gasPriceBN.isLessThanOrEqualTo(0)) {
      // Make sure we don't sign and send transactions with 0 gas price
      // This resulted in those TXs being stuck in the txpool for nodes running geth < v1.5.0
      throw new Error(`Preventing sign tx with 'gasPrice' set to '${gasPrice}'`)
    }

    return this.localSigner.signTransaction(addToV, encodedTx)
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(`${TAG}@signPersonalMessage`, `Signing ${data}`)
    return this.localSigner.signPersonalMessage(data)
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(`${TAG}@signTypedData`, `Signing typed DATA:`, { address: this.account, typedData })
    return this.localSigner.signTypedData(typedData)
  }

  getNativeKey() {
    return this.account.address
  }

  /**
   * Updates the passphrase of an account
   * @param oldPassphrase - the passphrase currently associated with the account
   * @param newPassphrase - the new passphrase to use with the account
   * @returns whether the update was successful
   */
  async updatePassphrase(oldPassphrase: string, newPassphrase: string) {
    const privateKey = await getStoredPrivateKey(this.account, oldPassphrase)
    if (!privateKey) {
      return false
    }
    await storePrivateKey(privateKey, this.account, newPassphrase)
    return true
  }

  async decrypt(ciphertext: Buffer): Promise<Buffer> {
    return this.localSigner.decrypt(ciphertext)
  }

  async computeSharedSecret(publicKey: string): Promise<Buffer> {
    return this.localSigner.computeSharedSecret(publicKey)
  }
}
